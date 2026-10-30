"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Leaf,
  User,
} from "lucide-react";
import {
  isValidEmail,
  passwordRequirements,
  validateCommunityRegistration,
  type RegistrationField,
} from "@/lib/community-registration";
import RegistrationLegalModal, { type RegistrationLegalNotice } from "@/components/auth/RegistrationLegalModals";

type FieldErrors = Partial<Record<RegistrationField, string>>;

const inputClass =
  "w-full min-h-12 bg-white text-base sm:text-sm text-[#143d2b] placeholder-[#a3b8ad] pl-10 pr-4 py-3 rounded-2xl border border-[#d6e3da] focus:border-[#16a34a] focus:ring-4 focus:ring-[#16a34a]/15 outline-none transition-all duration-200 disabled:opacity-60";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [legalNotice, setLegalNotice] = useState<RegistrationLegalNotice | null>(null);

  const openLegalNotice = (event: React.MouseEvent<HTMLButtonElement>, notice: RegistrationLegalNotice) => {
    event.preventDefault();
    event.stopPropagation();
    setLegalNotice(notice);
  };

  const requirements = passwordRequirements(password);

  const clearField = (field: RegistrationField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (errorMessage) setErrorMessage(null);
  };

  const checkEmailAvailability = async () => {
    if (!isValidEmail(email)) return;

    setIsCheckingEmail(true);
    try {
      const response = await fetch(`/api/auth/register?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      if (response.ok && data.available === false) {
        setFieldErrors((current) => ({
          ...current,
          email: data.error || "An account with this email already exists.",
        }));
      }
    } catch {
      // Submit still checks the address on the server.
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateCommunityRegistration({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      acceptedTerms,
    });

    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setErrorMessage(validation.error);
      return;
    }

    if (fieldErrors.email) {
      setErrorMessage(fieldErrors.email);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          acceptedTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.fieldErrors && typeof data.fieldErrors === "object") {
          setFieldErrors(data.fieldErrors);
        }
        throw new Error(data.error || "We couldn’t create your account. Please try again.");
      }

      setSuccessMessage("Community account created. Taking you to health screening...");
      window.setTimeout(() => {
        window.location.assign(data.redirectUrl || "/community/screening");
      }, 900);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] flex flex-col justify-between items-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6 font-sans text-[#143d2b] selection:bg-[#ccfbf1] selection:text-[#0f2c20]">
      <header className="w-full max-w-[1100px] flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#143d2b] hover:text-[#16a34a] bg-white/90 hover:bg-white px-4 py-2.5 rounded-full border border-[#d6e3da] shadow-xs hover:shadow-sm transition-all duration-200 group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to NaturAide</span>
        </Link>

        <Link href="/" className="flex lg:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-xl overflow-hidden bg-white p-0.5 border border-[#d6e3da] shadow-xs">
            <Image
              src="/images/nature-logo.png"
              alt="NaturAide logo"
              width={28}
              height={28}
              className="object-contain w-full h-full"
            />
          </div>
          <span className="font-heading font-extrabold text-base tracking-tight text-[#143d2b]">
            NaturAide
          </span>
        </Link>
      </header>

      <main className="w-full max-w-[1100px] my-auto py-4 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl lg:rounded-[28px] border border-[#dce6df] shadow-xl shadow-[#0f2c20]/5 overflow-hidden flex flex-col lg:flex-row lg:min-h-[680px] transition-all">
          <div className="hidden lg:flex lg:w-[45%] bg-[#091a13] text-white relative p-10 xl:p-12 flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none">
              <Image
                src="/images/hero-image.png"
                alt="NaturAide botanical medicinal plants"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 495px"
                className="object-cover object-[70%_center] filter brightness-[0.38] contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#091a13]/95 via-[#0f2c20]/88 to-[#071710]/95" />
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shadow-md group-hover:scale-105 transition-transform duration-200">
                  <Image
                    src="/images/nature-logo.png"
                    alt="NaturAide logo"
                    width={44}
                    height={44}
                    className="object-contain w-full h-full brightness-110"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-extrabold text-2xl tracking-tight text-white flex items-center gap-1.5">
                    NaturAide
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                  </span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-[#a7f3d0]">
                    Herbal Research & Care
                  </span>
                </div>
              </Link>
            </div>

            <div className="relative z-10 my-auto py-8 space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15 text-xs font-medium text-[#a7f3d0]">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>Community Care Account</span>
              </div>
              <h1 className="font-heading font-extrabold text-3xl xl:text-4xl text-white tracking-tight leading-tight">
                Begin with NaturAide
              </h1>
              <p className="text-sm xl:text-[15px] text-[#d1e0d7] leading-relaxed font-normal max-w-sm">
                Create a community account to explore validated herbal guidance. A one-time health screening follows after your account is ready.
              </p>
            </div>

            <div className="relative z-10 pt-5 border-t border-white/12">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a7f3d0]/90 mb-2.5">
                Included with your account
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-[#d1fae5]">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Plant Guide
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
                  Health Screening
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  Safety Guidance
                </span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[55%] bg-[#fdfcf9] p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="w-full max-w-[440px] mx-auto">
              <div className="mb-6">
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#143d2b] tracking-tight">
                  Create Account
                </h2>
                <p className="text-sm text-[#4a5a50] mt-1.5 font-normal">
                  Community registration only. Your role is assigned automatically.
                </p>
              </div>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-2.5"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm flex items-start gap-2.5"
                    role="status"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                    <p className="font-medium text-[#143d2b]">{successMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4" method="post" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-bold uppercase tracking-wider text-[#143d2b] mb-1.5">
                      First Name
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-[#78a386] pointer-events-none">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        disabled={isSubmitting}
                        value={firstName}
                        onChange={(event) => {
                          setFirstName(event.target.value);
                          clearField("firstName");
                        }}
                        placeholder="Juan"
                        aria-invalid={Boolean(fieldErrors.firstName)}
                        aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined}
                        className={inputClass}
                      />
                    </div>
                    {fieldErrors.firstName && (
                      <p id="firstName-error" className="mt-1.5 text-xs font-medium text-amber-800">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-xs font-bold uppercase tracking-wider text-[#143d2b] mb-1.5">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      disabled={isSubmitting}
                      value={lastName}
                      onChange={(event) => {
                        setLastName(event.target.value);
                        clearField("lastName");
                      }}
                      placeholder="Dela Cruz"
                      aria-invalid={Boolean(fieldErrors.lastName)}
                      aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined}
                      className="w-full min-h-12 bg-white text-base sm:text-sm text-[#143d2b] placeholder-[#a3b8ad] px-4 py-3 rounded-2xl border border-[#d6e3da] focus:border-[#16a34a] focus:ring-4 focus:ring-[#16a34a]/15 outline-none transition-all duration-200 disabled:opacity-60"
                    />
                    {fieldErrors.lastName && (
                      <p id="lastName-error" className="mt-1.5 text-xs font-medium text-amber-800">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#143d2b] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-[#78a386] pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={isSubmitting}
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearField("email");
                      }}
                      onBlur={checkEmailAvailability}
                      placeholder="you@example.com"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      className={inputClass}
                    />
                  </div>
                  {isCheckingEmail && (
                    <p className="mt-1.5 text-xs font-medium text-[#52796f]">Checking email...</p>
                  )}
                  {fieldErrors.email && (
                    <p id="email-error" className="mt-1.5 text-xs font-medium text-amber-800">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#143d2b] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#78a386]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearField("password");
                      }}
                      placeholder="Create a password"
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby="password-requirements"
                      className={`${inputClass} password-field pr-12!`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isSubmitting}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#78a386] hover:text-[#143d2b] transition-colors cursor-pointer disabled:cursor-not-allowed"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-controls="password"
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <ul id="password-requirements" className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {requirements.map((rule) => (
                      <li
                        key={rule.id}
                        className={`flex items-center gap-1.5 text-xs font-medium ${
                          password && rule.met ? "text-[#15803d]" : "text-[#6b7c76]"
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${password && rule.met ? "text-[#16a34a]" : "text-[#c5d7cb]"}`} />
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-xs font-medium text-amber-800">{fieldErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-[#143d2b] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#78a386]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        clearField("confirmPassword");
                      }}
                      placeholder="Repeat your password"
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                      className={`${inputClass} password-field pr-12!`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      disabled={isSubmitting}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#78a386] hover:text-[#143d2b] transition-colors cursor-pointer disabled:cursor-not-allowed"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-controls="confirmPassword"
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p id="confirmPassword-error" className="mt-1.5 text-xs font-medium text-amber-800">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => {
                        setAcceptedTerms(event.target.checked);
                        clearField("acceptedTerms");
                      }}
                      disabled={isSubmitting}
                      className="mt-1 w-5 h-5 rounded text-[#16a34a] border-[#d6e3da] focus:ring-[#16a34a] cursor-pointer accent-[#16a34a]"
                    />
                    <span className="text-sm font-medium text-[#4a5a50] leading-relaxed">
                      I accept the{" "}
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => openLegalNotice(event, "terms")}
                        className="font-semibold text-[#15803d] underline decoration-[#16a34a]/40"
                      >
                        Terms of Use
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => openLegalNotice(event, "privacy")}
                        className="font-semibold text-[#15803d] underline decoration-[#16a34a]/40"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                  {fieldErrors.acceptedTerms && (
                    <p className="mt-1.5 text-xs font-medium text-amber-800">{fieldErrors.acceptedTerms}</p>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-12 inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full text-base font-semibold text-white bg-[#143d2b] hover:bg-[#1b533a] hover:-translate-y-0.5 shadow-md shadow-[#143d2b]/15 hover:shadow-lg hover:shadow-[#143d2b]/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#a7f3d0]" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4 text-[#a7f3d0] group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <p className="mt-4 text-xs leading-relaxed text-[#6b7c76]">
                By creating an account, you agree to NaturAide’s{" "}
                <button
                  type="button"
                  onClick={(event) => openLegalNotice(event, "terms")}
                  className="font-semibold text-[#15803d] underline decoration-[#16a34a]/40"
                >
                  Terms of Use
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={(event) => openLegalNotice(event, "privacy")}
                  className="font-semibold text-[#15803d] underline decoration-[#16a34a]/40"
                >
                  Privacy Policy
                </button>
                .
              </p>

              <div className="mt-6 pt-5 border-t border-[#e2ebe4] text-center">
                <p className="text-sm text-[#4a5a50]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[#15803d] hover:text-[#143d2b] underline decoration-[#16a34a]/40 hover:decoration-[#143d2b] transition-all"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-[1100px] text-center py-2 text-xs text-[#78997f]">
        <p>© 2026 NaturAide. Validated Botanical Healthcare & Research Platform.</p>
      </footer>

      {legalNotice === "terms" && (
        <RegistrationLegalModal notice="terms" onClose={() => setLegalNotice(null)} />
      )}
      {legalNotice === "privacy" && (
        <RegistrationLegalModal notice="privacy" onClose={() => setLegalNotice(null)} />
      )}
    </div>
  );
}
