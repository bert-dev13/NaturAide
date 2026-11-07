import type { Metadata } from "next";
import { Manrope, DM_Sans } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NaturAide — Where Nature Meets Scientific Evidence",
  description:
    "An evidence-based herbal research platform connecting community knowledge, computational in-silico screening, molecular docking, formulation safety, and clinical peer review.",
  keywords: [
    "herbal research",
    "pharmacognosy",
    "medicinal plants",
    "phytochemistry",
    "in-silico molecular docking",
    "evidence-based medicine",
    "ethnobotany",
    "clinical monographs",
  ],
  openGraph: {
    title: "NaturAide — Evidence-Based Herbal Research Platform",
    description: "Where Nature Meets Scientific Evidence. Connecting Community, Researchers, and Expert Reviewers.",
    type: "website",
  },
};

export const instant = false;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-[#faf9f5] text-[#131b17] antialiased selection:bg-[#ccfbf1] selection:text-[#0f2c20]">
        {children}
      </body>
    </html>
  );
}
