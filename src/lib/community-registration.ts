export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export type RegistrationField =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword"
  | "acceptedTerms";

export interface CommunityRegistrationInput {
  firstName: unknown;
  lastName: unknown;
  email: unknown;
  password: unknown;
  confirmPassword: unknown;
  acceptedTerms: unknown;
}

export interface NormalizedRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  name: string;
}

export interface PasswordRequirement {
  id: "length" | "upper" | "lower" | "number";
  label: string;
  met: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]{0,59}$/u;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      id: "upper",
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lower",
      label: "One lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "One number",
      met: /[0-9]/.test(password),
    },
  ];
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length > 0 && normalized.length <= 254 && EMAIL_PATTERN.test(normalized);
}

function nameError(value: string, label: "first" | "last"): string | null {
  if (!value) return `Please enter your ${label} name.`;
  if (!NAME_PATTERN.test(value)) {
    return `Use letters for your ${label} name.`;
  }
  return null;
}

export function validateCommunityRegistration(
  input: CommunityRegistrationInput
):
  | { ok: true; value: NormalizedRegistration }
  | { ok: false; fieldErrors: Partial<Record<RegistrationField, string>>; error: string } {
  const fieldErrors: Partial<Record<RegistrationField, string>> = {};

  const firstName = typeof input.firstName === "string" ? input.firstName.trim() : "";
  const lastName = typeof input.lastName === "string" ? input.lastName.trim() : "";
  const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword = typeof input.confirmPassword === "string" ? input.confirmPassword : "";
  const acceptedTerms = input.acceptedTerms === true;

  const firstNameError = nameError(firstName, "first");
  const lastNameError = nameError(lastName, "last");
  if (firstNameError) fieldErrors.firstName = firstNameError;
  if (lastNameError) fieldErrors.lastName = lastNameError;

  if (!email) {
    fieldErrors.email = "Please enter your email address.";
  } else if (!isValidEmail(email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }

  const unmet = passwordRequirements(password).filter((rule) => !rule.met);
  if (!password) {
    fieldErrors.password = "Please create a password.";
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    fieldErrors.password = "Password must be 72 characters or fewer.";
  } else if (unmet.length > 0) {
    fieldErrors.password = `Password needs ${unmet.map((rule) => rule.label.toLowerCase()).join(", ")}.`;
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (!acceptedTerms) {
    fieldErrors.acceptedTerms = "Please accept the Terms of Use and Privacy Policy.";
  }

  const firstError = Object.values(fieldErrors)[0];
  if (firstError) {
    return { ok: false, fieldErrors, error: firstError };
  }

  return {
    ok: true,
    value: {
      firstName,
      lastName,
      email,
      password,
      name: `${firstName} ${lastName}`,
    },
  };
}
