import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — NaturAide",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#143d2b] px-5 py-12">
      <article className="max-w-2xl mx-auto bg-white border border-[#dce6df] rounded-3xl p-8 sm:p-10 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#15803d]">NaturAide</p>
        <h1 className="font-heading text-3xl font-extrabold mt-2">Terms of Use</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#4a5a50]">
          <p>
            NaturAide community accounts are for educational botanical guidance. Creating an account does not create a medical relationship and does not replace care from a qualified professional.
          </p>
          <p>
            Community registration assigns the Community role only. Researcher and Reviewer access are issued separately and cannot be selected during public registration.
          </p>
          <p>
            After you create an account, you complete a health screening once. NaturAide uses that result to decide whether recommendation-oriented herbal guidance is available to your account.
          </p>
          <p>
            You agree to provide accurate registration details and to keep your password private.
          </p>
        </div>
        <Link href="/register" className="inline-flex mt-8 text-sm font-semibold text-[#15803d] underline">
          Return to Create Account
        </Link>
      </article>
    </main>
  );
}
