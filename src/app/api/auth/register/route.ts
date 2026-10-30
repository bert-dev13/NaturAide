import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { isValidEmail, normalizeEmail, validateCommunityRegistration } from "@/lib/community-registration";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type FailureKind =
  | "validation"
  | "duplicate email"
  | "password hashing"
  | "DB connection"
  | "DB/table missing"
  | "SQL error";

function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: string }).code || "");
  }
  return "";
}

function isDuplicateKey(error: unknown): boolean {
  return errorCode(error) === "ER_DUP_ENTRY";
}

function classifyDatabaseError(error: unknown): FailureKind {
  const code = errorCode(error);
  const message = error instanceof Error ? error.message : "";
  if (
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ECONNRESET" ||
    code === "EHOSTUNREACH" ||
    code === "EPIPE" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR" ||
    code === "ER_ACCESS_DENIED_ERROR" ||
    code === "ER_DBACCESS_DENIED_ERROR" ||
    message.startsWith("connect ")
  ) {
    return "DB connection";
  }
  if (code === "ER_BAD_DB_ERROR" || code === "ER_NO_SUCH_TABLE") {
    return "DB/table missing";
  }
  return "SQL error";
}

function publicDatabaseMessage(kind: FailureKind, action: "availability" | "registration"): string {
  if (kind === "DB connection") {
    const what = action === "availability" ? "Email availability" : "Registration";
    return `${what} could not reach the database. Make sure XAMPP MySQL is running, then try again.`;
  }
  if (kind === "DB/table missing") {
    return "The NatureAide database or a required table is missing.";
  }
  if (action === "availability") {
    return "Email availability could not be checked because of a database error.";
  }
  return "Registration could not be saved because of a database error.";
}

function logRegistrationFailure(kind: FailureKind, error: unknown) {
  const code = errorCode(error);
  const errno =
    typeof error === "object" && error !== null && "errno" in error
      ? (error as { errno?: number }).errno
      : undefined;
  const message = error instanceof Error ? error.message : "Unknown registration error";
  console.error(`[register] ${kind}`, { code: code || undefined, errno, message });
}

export async function GET(request: Request) {
  try {
    const emailParam = new URL(request.url).searchParams.get("email") || "";
    if (!isValidEmail(emailParam)) {
      console.warn("[register] validation error", { field: "email" });
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address.", failure: "validation" },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(emailParam);
    const [existing]: any = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        available: false,
        error: "An account with this email already exists.",
      });
    }

    return NextResponse.json({ success: true, available: true });
  } catch (error) {
    const kind = classifyDatabaseError(error);
    logRegistrationFailure(kind, error);
    return NextResponse.json(
      { success: false, error: publicDatabaseMessage(kind, "availability"), failure: kind },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let connection: Awaited<ReturnType<typeof pool.getConnection>> | null = null;

  try {
    const body = await request.json();
    const validation = validateCommunityRegistration({
      firstName: body?.firstName,
      lastName: body?.lastName,
      email: body?.email,
      password: body?.password,
      confirmPassword: body?.confirmPassword,
      acceptedTerms: body?.acceptedTerms,
    });

    if (!validation.ok) {
      console.warn("[register] validation error", { fields: Object.keys(validation.fieldErrors) });
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          fieldErrors: validation.fieldErrors,
          failure: "validation",
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, name } = validation.value;
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
      logRegistrationFailure("password hashing", error);
      return NextResponse.json(
        {
          success: false,
          error: "The password could not be secured. Please try again.",
          failure: "password hashing",
        },
        { status: 500 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing]: any = await connection.query(
      "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      await connection.rollback();
      console.warn("[register] duplicate email");
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists.",
          fieldErrors: { email: "An account with this email already exists." },
          failure: "duplicate email",
        },
        { status: 409 }
      );
    }

    // Community registration never accepts a client-supplied role.
    const [insertResult]: any = await connection.query(
      `INSERT INTO users (email, password, role, name, createdAt, updatedAt)
       VALUES (?, ?, 'COMMUNITY', ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [email, hashedPassword, name]
    );

    const userId = Number(insertResult.insertId);

    await connection.query(
      `INSERT INTO user_profiles (userId, firstName, lastName, createdAt, updatedAt)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [userId, firstName, lastName]
    );

    await connection.commit();

    const token = await createSessionToken({
      id: userId,
      email,
      role: "COMMUNITY",
      name,
      screeningResult: "NONE",
    });

    const response = NextResponse.json({
      success: true,
      message: "Community account created.",
      user: {
        id: userId,
        email,
        role: "COMMUNITY",
        name,
        firstName,
        lastName,
        screeningStatus: "NONE",
      },
      redirectUrl: "/community/screening",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    response.cookies.set({
      name: "natureaide_screening",
      value: "NONE",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // The original error is returned below.
      }
    }

    if (isDuplicateKey(error)) {
      console.warn("[register] duplicate email");
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists.",
          fieldErrors: { email: "An account with this email already exists." },
          failure: "duplicate email",
        },
        { status: 409 }
      );
    }

    const kind = classifyDatabaseError(error);
    logRegistrationFailure(kind, error);
    return NextResponse.json(
      { success: false, error: publicDatabaseMessage(kind, "registration"), failure: kind },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
