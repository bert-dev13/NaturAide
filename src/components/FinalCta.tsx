"use client";

import React, { useState } from "react";
import { 
  Sprout, 
  FlaskConical, 
  ArrowRight, 
  Check, 
  Mail, 
  Sparkles, 
  ShieldCheck, 
  Users 
} from "lucide-react";

export function FinalCta() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <section className="py-24 bg-[#faf9f5] relative overflow-hidden border-t border-[#dde6df]">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#ccfbf1]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main CTA Card */}
        <div className="bg-gradient-to-br from-[#0f2c20] via-[#164533] to-[#091a13] rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl relative overflow-hidden border border-[#297a5b]/40">
          
          {/* Subtle SVG Grid overlay */}
          <div className="absolute inset-0 molecular-grid opacity-15 pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            
            <div className="inline-flex items-center gap-2 bg-[#1e5c44]/80 border border-[#297a5b] px-4 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-[#14b8a6]" />
              <span className="text-xs font-bold text-[#ccfbf1] uppercase tracking-wider">
                Shape the Future of Botanical Bioscience
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight leading-tight">
              Begin Exploring Evidence-Based Herbal Medicine Today
            </h2>

            <p className="text-base sm:text-lg text-[#c4d4c7] max-w-2xl mx-auto leading-relaxed">
              Whether you are an individual seeking safe, verified herbal preparation guidance or a research team screening bioactive secondary metabolites — NatureAide provides the definitive empirical standard.
            </p>

            {/* Split Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-left">
              
              {/* Community Option */}
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white mb-2">
                    For Community & Practitioners
                  </h3>
                  <p className="text-xs sm:text-sm text-[#c4d4c7] leading-relaxed mb-4">
                    Access free peer-reviewed monographs, safe traditional preparation recipes, and instant herb-drug interaction safety tools.
                  </p>
                </div>
                <a
                  href="#plants"
                  className="inline-flex items-center justify-between text-xs sm:text-sm font-semibold text-white bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl transition-colors"
                >
                  <span>Explore Public Monographs</span>
                  <ArrowRight className="w-4 h-4 text-[#ccfbf1]" />
                </a>
              </div>

              {/* Researchers Option */}
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#14b8a6] text-[#0f2c20] flex items-center justify-center mb-4">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white mb-2">
                    For Bioscience Researchers & Labs
                  </h3>
                  <p className="text-xs sm:text-sm text-[#c4d4c7] leading-relaxed mb-4">
                    Obtain research credentials for high-throughput in-silico AutoDock screening, HPLC spectral exports, and collaborative authoring.
                  </p>
                </div>
                <a
                  href="#workbench"
                  className="inline-flex items-center justify-between text-xs sm:text-sm font-semibold text-[#0f2c20] bg-[#14b8a6] hover:bg-[#2dd4bf] px-4 py-2.5 rounded-xl transition-colors shadow-md"
                >
                  <span>Request Workbench Access</span>
                  <ArrowRight className="w-4 h-4 text-[#0f2c20]" />
                </a>
              </div>

            </div>

            {/* Newsletter Dispatch Signup */}
            <div className="pt-8 mt-6 border-t border-white/10 max-w-xl mx-auto">
              <p className="text-xs font-semibold text-[#ccfbf1] mb-3">
                Subscribe to the Monthly Botanical Research & Monograph Dispatch
              </p>
              {subscribed ? (
                <div className="p-3 rounded-xl bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-[#14b8a6]" />
                  <span>Thank you! You are subscribed to NatureAide research dispatches.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your institutional or personal email..."
                    className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/60 text-xs sm:text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[#14b8a6]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-white text-[#0f2c20] hover:bg-[#edf2ee] rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
