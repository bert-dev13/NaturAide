import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "natureaide_session";
const DEV_FALLBACK_SECRET = "natureaide_default_dev_secret_key_32chars_long!!";

function getSecretKey(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") return null;
    return new TextEncoder().encode(secret || DEV_FALLBACK_SECRET);
  }
  return new TextEncoder().encode(secret);
}

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  screeningResult?: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let session: TokenPayload | null = null;
  const secretKey = getSecretKey();
  if (token && secretKey) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      session = payload as unknown as TokenPayload;
    } catch {
      session = null;
    }
  }

  // Private research uploads: authenticated research-side roles only.
  // (Community users and anonymous visitors must never read research documents.)
  if (pathname.startsWith("/uploads/research/")) {
    const r = (session?.role || "").toUpperCase();
    if (!session || (r !== "RESEARCHER" && r !== "REVIEWER")) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
  }

  const role = (session?.role || "").toUpperCase();

  // Redirect logged-in users away from public auth pages
  if (pathname === "/login" || pathname === "/register") {
    if (session) {
      if (role === "COMMUNITY") {
        const rawSc = request.cookies.get("natureaide_screening")?.value || session.screeningResult;
        const sc = rawSc && rawSc !== "NONE" ? rawSc : null;
        if (!sc) return NextResponse.redirect(new URL("/community/screening", request.url));
        if (sc === "PROFESSIONAL_GUIDANCE_REQUIRED") return NextResponse.redirect(new URL("/community/guidance", request.url));
        return NextResponse.redirect(new URL("/community", request.url));
      }
      if (role === "RESEARCHER") return NextResponse.redirect(new URL("/researcher", request.url));
      if (role === "REVIEWER") return NextResponse.redirect(new URL("/reviewer", request.url));
    }
    return NextResponse.next();
  }

  // Protected route checking
  const isCommunityRoute = pathname.startsWith("/community");
  const isResearcherRoute = pathname.startsWith("/researcher");
  const isReviewerRoute = pathname.startsWith("/reviewer");

  if (isCommunityRoute || isResearcherRoute || isReviewerRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based authorization
    if (isCommunityRoute) {
      if (role !== "COMMUNITY") {
        const target = role === "RESEARCHER" ? "/researcher" : "/reviewer";
        return NextResponse.redirect(new URL(target, request.url));
      }

      // Community Screening Guards
      const rawSc = request.cookies.get("natureaide_screening")?.value || session.screeningResult;
      const sc = rawSc && rawSc !== "NONE" ? rawSc : null;
      const isScreeningRoute = pathname === "/community/screening";
      const isGuidanceRoute = pathname === "/community/guidance";
      const isFacilitiesRoute = pathname === "/community/facilities";
      const isProfileRoute = pathname.startsWith("/community/profile");
      const isRetake = request.nextUrl.searchParams.get("retake") === "true";
      const isForce = request.nextUrl.searchParams.get("force") === "true";

      // If user was redirected to screening due to missing DB record, clear stale cookie and allow screening
      if (isScreeningRoute && isForce) {
        const response = NextResponse.next();
        response.cookies.delete("natureaide_screening");
        return response;
      }

      // 1. If user has no valid screening, restrict to /community/screening (allow profile)
      if (!sc) {
        if (!isScreeningRoute && !isProfileRoute) {
          return NextResponse.redirect(new URL("/community/screening", request.url));
        }
      } else if (sc === "PROFESSIONAL_GUIDANCE_REQUIRED") {
        // Direct route protection: Do NOT automatically start another screening if completed
        if (isScreeningRoute && !isRetake && !isForce) {
          return NextResponse.redirect(new URL("/community/guidance", request.url));
        }

        // STOP recommendation-oriented herbal flow: redirect to /community/guidance
        if (!isGuidanceRoute && !isFacilitiesRoute && !isScreeningRoute && !isProfileRoute) {
          return NextResponse.redirect(new URL("/community/guidance", request.url));
        }
      } else if (sc === "ELIGIBLE_TO_CONTINUE") {
        // Direct route protection: Do NOT automatically start another screening if completed
        if (isScreeningRoute && !isRetake && !isForce) {
          return NextResponse.redirect(new URL("/community", request.url));
        }

        // Guidance page is not applicable to eligible users
        if (isGuidanceRoute) {
          return NextResponse.redirect(new URL("/community", request.url));
        }
      }
    }

    if (isResearcherRoute && role !== "RESEARCHER") {
      const target = role === "COMMUNITY" ? "/community" : "/reviewer";
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (isReviewerRoute && role !== "REVIEWER") {
      const target = role === "COMMUNITY" ? "/community" : "/researcher";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/community/:path*",
    "/researcher/:path*",
    "/reviewer/:path*",
    "/login",
    "/register",
    "/uploads/research/:path*",
  ],
};
