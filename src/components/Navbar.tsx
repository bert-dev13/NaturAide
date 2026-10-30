"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#hero" },
    { name: "About", href: "#about" },
    { name: "Community", href: "#users" },
    { name: "Researchers", href: "#users" },
    { name: "Health Professionals", href: "#users" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#e2ebe4] py-3.5 shadow-xs"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* NaturAide Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden bg-white p-0.5 border border-[#e2ebe4] shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide logo"
                width={40}
                height={40}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl tracking-tight text-[#143d2b] flex items-center gap-1">
                NaturAide
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-[#78a386]">
                Herbal Research & Care
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#e2ebe4] shadow-xs">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-semibold text-[#2d3a33] hover:text-[#143d2b] hover:bg-[#f1f5f2] px-3.5 py-1.5 rounded-full transition-colors duration-150"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons: Sign In & Get Started */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#143d2b] hover:text-[#16a34a] px-4 py-2 rounded-full hover:bg-[#e2ebe4]/60 transition-colors cursor-pointer"
            >
              Sign In
            </Link>
            <a
              href="#users"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#143d2b] hover:bg-[#1b533a] px-5 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all hover:translate-y-[-1px]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 text-[#c5d7cb]" />
            </a>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#143d2b] hover:bg-[#f1f5f2] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-[#e2ebe4] bg-[#faf8f5]/98 backdrop-blur-xl px-4 pt-3 pb-6 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#143d2b] hover:bg-[#f1f5f2] transition-colors flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <ArrowRight className="w-4 h-4 text-[#78a386]" />
                </a>
              ))}
              <div className="pt-4 border-t border-[#e2ebe4] flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-full text-center text-sm font-semibold text-[#143d2b] border border-[#e2ebe4] hover:bg-[#f1f5f2] transition-colors inline-block"
                >
                  Sign In
                </Link>
                <a
                  href="#users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-full text-center text-sm font-semibold text-white bg-[#143d2b] hover:bg-[#1b533a] shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
