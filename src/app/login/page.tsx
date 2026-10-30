"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Leaf
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Interaction State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    role: string;
    message: string;
    redirectUrl: string;
  } | null>(null);

  // Field validation helper
  const validateForm = () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address (e.g. name@domain.com).");
      return false;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return false;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Connect to the authentication backend API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please check your credentials.");
      }

      // Format role display label
      let roleLabel = "Community Platform";
      const uRole = (data.user?.role || "").toUpperCase();
      if (uRole === "RESEARCHER") {
        roleLabel = "Researcher Platform";
      } else if (uRole === "REVIEWER") {
        roleLabel = "Reviewer Platform";
      }

      setSuccessInfo({
        role: roleLabel,
        message: "Authentication verified. Redirecting to your platform...",
        redirectUrl: data.redirectUrl || "/community",
      });

      // Brief smooth transition before redirect
      setTimeout(() => {
        router.push(data.redirectUrl || "/#plants");
      }, 1200);

    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] flex flex-col justify-between items-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6 font-sans text-[#143d2b] selection:bg-[#ccfbf1] selection:text-[#0f2c20]">
      
      {/* TOP HEADER: Simple Back Button */}
      <header className="w-full max-w-[1100px] flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#143d2b] hover:text-[#16a34a] bg-white/90 hover:bg-white px-4 py-2 rounded-full border border-[#d6e3da] shadow-xs hover:shadow-sm transition-all duration-200 group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to NaturAide</span>
        </Link>

        {/* Mobile Logo Branding (visible when left visual panel is hidden) */}
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

      {/* UNIFIED CENTERED LOGIN CONTAINER (1050-1150px wide, ~620-680px tall on desktop) */}
      <main className="w-full max-w-[1100px] my-auto py-4 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl lg:rounded-[28px] border border-[#dce6df] shadow-xl shadow-[#0f2c20]/5 overflow-hidden flex flex-col lg:flex-row lg:h-[640px] transition-all">
          
          {/* ========================================================= */}
          {/* LEFT PANEL: NATURAIDE BOTANICAL BRANDING (45%)            */}
          {/* ========================================================= */}
          <div className="hidden lg:flex lg:w-[45%] bg-[#091a13] text-white relative p-10 xl:p-12 flex-col justify-between overflow-hidden">
            
            {/* Background Botanical Image with Dark Forest Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <Image
                src="/images/hero-image.png"
                alt="NaturAide botanical medicinal plants and laboratory research"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 495px"
                className="object-cover object-[70%_center] filter brightness-[0.38] contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#091a13]/95 via-[#0f2c20]/88 to-[#071710]/95" />
              
              {/* Subtle Ambient Botanical Glow Accents */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Top Brand Identity */}
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

            {/* Middle Welcome Statement & Subtle Visuals */}
            <div className="relative z-10 my-auto py-8 space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15 text-xs font-medium text-[#a7f3d0]">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>Evidence-Based Botanical Platform</span>
              </div>
              <h1 className="font-heading font-extrabold text-3xl xl:text-4xl text-white tracking-tight leading-tight">
                Welcome Back to NaturAide
              </h1>
              <p className="text-sm xl:text-[15px] text-[#d1e0d7] leading-relaxed font-normal max-w-sm">
                Explore validated traditional herbal knowledge, computational phytochemistry, and peer-reviewed safety guidance.
              </p>
            </div>

            {/* Bottom: Simplified Role Badges */}
            <div className="relative z-10 pt-5 border-t border-white/12">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a7f3d0]/90 mb-2.5">
                Unified Portal For
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-[#d1fae5]">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Community Guides
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
                  Research Lab
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  Expert Reviewers
                </span>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: CLEAN LOGIN FORM (55%)                       */}
          {/* ========================================================= */}
          <div className="w-full lg:w-[55%] bg-[#fdfcf9] p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="w-full max-w-[420px] mx-auto">
              
              {/* Form Heading & Subtext */}
              <div className="mb-6">
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#143d2b] tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-[#4a5a50] mt-1.5 font-normal">
                  Please enter your account details to sign in.
                </p>
              </div>

              {/* Error Feedback Message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Feedback & Redirect Message */}
              <AnimatePresence>
                {successInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5"
                    role="status"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#143d2b]">Verified: {successInfo.role}</p>
                      <p className="text-emerald-800 mt-0.5">{successInfo.message}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* LOGIN FORM */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                
                {/* Email Field */}
                <div>
                  <label 
                    htmlFor="email"
                    className="block text-xs font-bold uppercase tracking-wider text-[#143d2b] mb-1.5"
                  >
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="you@example.com"
                      className="w-full bg-white focus:bg-white text-sm text-[#143d2b] placeholder-[#a3b8ad] pl-10 pr-4 py-3 rounded-2xl border border-[#d6e3da] focus:border-[#16a34a] focus:ring-4 focus:ring-[#16a34a]/15 outline-none transition-all duration-200 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor="password"
                      className="block text-xs font-bold uppercase tracking-wider text-[#143d2b]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => alert("Password reset instructions will be sent to your verified email.")}
                      className="text-xs font-semibold text-[#16a34a] hover:text-[#15803d] hover:underline transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-[#78a386] pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      disabled={isSubmitting}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="••••••••"
                      className="password-field w-full bg-white focus:bg-white text-sm text-[#143d2b] placeholder-[#a3b8ad] pl-10 pr-11 py-3 rounded-2xl border border-[#d6e3da] focus:border-[#16a34a] focus:ring-4 focus:ring-[#16a34a]/15 outline-none transition-all duration-200 disabled:opacity-60 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                      className="absolute right-3.5 p-1 text-[#78a386] hover:text-[#143d2b] transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isSubmitting}
                      className="w-4 h-4 rounded text-[#16a34a] border-[#d6e3da] focus:ring-[#16a34a] focus:ring-offset-0 cursor-pointer accent-[#16a34a]"
                    />
                    <span className="text-xs sm:text-sm font-medium text-[#4a5a50]">
                      Remember me
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full text-sm sm:text-base font-semibold text-white bg-[#143d2b] hover:bg-[#1b533a] active:translate-y-0 hover:-translate-y-0.5 shadow-md shadow-[#143d2b]/15 hover:shadow-lg hover:shadow-[#143d2b]/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#a7f3d0]" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 text-[#a7f3d0] group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Create Account Link */}
              <div className="mt-6 pt-5 border-t border-[#e2ebe4] text-center">
                <p className="text-xs sm:text-sm text-[#4a5a50]">
                  Don’t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-bold text-[#15803d] hover:text-[#143d2b] underline decoration-[#16a34a]/40 hover:decoration-[#143d2b] transition-all cursor-pointer"
                  >
                    Create an Account
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* MINIMAL FOOTER */}
      <footer className="w-full max-w-[1100px] text-center py-2 text-xs text-[#78997f]">
        <p>© 2026 NaturAide. Validated Botanical Healthcare & Research Platform.</p>
      </footer>

    </div>
  );
}
