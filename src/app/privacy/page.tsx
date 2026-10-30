import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — NaturAide",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#143d2b] px-5 py-12">
      <article className="max-w-2xl mx-auto bg-white border border-[#dce6df] rounded-3xl p-8 sm:p-10 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#15803d]">NaturAide</p>
        <h1 className="font-heading text-3xl font-extrabold mt-2">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#4a5a50]">
          <p>
            NaturAide stores your name, email address, and a hashed password so you can sign in. Passwords are never stored in plain text.
          </p>
          <p>
            Health screening answers are saved only after you complete the screening. Registration does not create screening responses.
          </p>
          <p>
            Your session is kept in a secure HTTP-only cookie. NaturAide does not use browser local storage as the source of authentication.
          </p>
          <p>
            Account details are used to operate the community platform, apply safety rules, and protect existing Researcher and Reviewer accounts from being overwritten.
          </p>
        </div>
        <Link href="/register" className="inline-flex mt-8 text-sm font-semibold text-[#15803d] underline">
          Return to Create Account
        </Link>
      </article>
    </main>
  );
}
