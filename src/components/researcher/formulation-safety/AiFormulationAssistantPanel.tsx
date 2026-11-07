"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  FlaskConical,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import type { FormulationComponentItem } from "./FormulationCompositionTable";

interface Props {
  projectId: number;
  plantName: string;
  dosageFormType: string;
  onApplyComponents?: (newComponents: FormulationComponentItem[]) => void;
  onApplyProposalRationale?: (rationale: {
    scientificRationale?: string;
    compatibilityConsiderations?: string;
    safetyAndLimitations?: string;
  }) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  proposal?: any;
}

const QUICK_PROMPT_CHIPS = [
  {
    label: "Generate preliminary formulation proposal",
    prompt: "Generate a complete preliminary formulation proposal with pharmacopeial excipients, roles, and safety considerations.",
    icon: Sparkles,
  },
  {
    label: "Suggest excipients for topical hydrogel",
    prompt: "What excipients, gelling polymers, and neutralizers are recommended for a botanical topical hydrogel?",
    icon: FlaskConical,
  },
  {
    label: "Check excipient compatibility & pH",
    prompt: "What are the compatibility risks, optimal pH range, and stability factors for this botanical formulation?",
    icon: ShieldAlert,
  },
  {
    label: "Required laboratory validation tests",
    prompt: "What specific laboratory validation tests (rheology, dissolution, stability, microbial limits) are required before preclinical trials?",
    icon: Lightbulb,
  },
];

export default function AiFormulationAssistantPanel({
  projectId,
  plantName,
  dosageFormType,
  onApplyComponents,
  onApplyProposalRationale,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-1",
      sender: "ai",
      text: `Hello! I am your AI Formulation Assistant for ${plantName}. I analyze your plant identity (Stage 1), screened phytochemicals (Stage 2), and molecular docking findings (Stage 3) to help engineer a preliminary botanical formulation. What would you like to design or optimize?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [appliedProposalIds, setAppliedProposalIds] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(promptText?: string) {
    const textToSend = (promptText || inputPrompt).trim();
    if (!textToSend || sending) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setSending(true);

    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/formulation/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          dosageFormType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to receive formulation advice.");
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply || "Proposal synthesized.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        proposal: data.proposal,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `Error: ${err.message || "Could not connect to formulation engine."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }

  function handleApplyProposal(proposal: any, msgId: string) {
    if (!proposal) return;

    if (Array.isArray(proposal.components) && onApplyComponents) {
      const formattedComponents: FormulationComponentItem[] = proposal.components.map(
        (c: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          componentName: c.componentName,
          roleInFormulation: c.roleInFormulation,
          proposedConcentration: c.proposedConcentration,
          evidenceStatus: c.evidenceStatus || "SUPPORTED",
          scientificRationale: c.scientificRationale,
          sourceReference: c.sourceReference,
          isAiSuggested: true,
        })
      );
      onApplyComponents(formattedComponents);
    }

    if (onApplyProposalRationale) {
      onApplyProposalRationale({
        scientificRationale: proposal.scientificRationale,
        compatibilityConsiderations: proposal.compatibilityConsiderations,
        safetyAndLimitations: proposal.safetyAndLimitations,
      });
    }

    setAppliedProposalIds((prev) => new Set([...prev, msgId]));
  }

  return (
    <div className="rounded-3xl border border-emerald-900/40 bg-gradient-to-br from-[#072418] via-[#0d3626] to-[#041910] text-white shadow-xl overflow-hidden transition-all">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800/40 bg-black/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-300 flex items-center justify-center text-[#051a11] shadow-md shadow-emerald-500/25">
            <Sparkles className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-white">
                AI Formulation Assistant
              </h3>
              <span className="font-mono text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                In-Stage 4 Co-Pilot
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              Formulation compounding advisor grounded in {plantName} Stages 1–3 data
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-200 hover:text-white transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand Assistant" : "Collapse Assistant"}
        >
          {collapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col h-[420px]">
          {/* Quick Action Chips Bar */}
          <div className="p-2.5 bg-black/20 border-b border-emerald-800/30 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
            {QUICK_PROMPT_CHIPS.map((chip, idx) => {
              const IconComp = chip.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip.prompt)}
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/40 text-[11px] font-bold text-emerald-200 hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs disabled:opacity-50"
                >
                  <IconComp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              const isApplied = appliedProposalIds.has(msg.id);

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAi ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                      isAi
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-teal-500 text-teal-950 font-bold"
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`space-y-2 max-w-[85%] ${isAi ? "" : "text-right"}`}>
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed ${
                        isAi
                          ? "bg-emerald-950/70 border border-emerald-800/60 text-emerald-50"
                          : "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-medium shadow-sm ml-auto text-left"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>

                    {/* Proposal Action Card (if AI suggested a structured proposal) */}
                    {isAi && msg.proposal && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-900/90 to-[#072418] border border-emerald-400/50 shadow-md space-y-2.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-400/30">
                            Proposal Components ({msg.proposal.components?.length || 0})
                          </span>
                          <span className="text-[10px] text-emerald-200">
                            {msg.proposal.dosageFormType}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white">
                            {msg.proposal.formulationName}
                          </h4>
                          <p className="text-[11px] text-emerald-200/80 line-clamp-2">
                            {msg.proposal.scientificRationale}
                          </p>
                        </div>

                        {/* Apply Button */}
                        <button
                          type="button"
                          onClick={() => handleApplyProposal(msg.proposal, msg.id)}
                          disabled={isApplied}
                          className={`w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                            isApplied
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-700/60"
                              : "bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-[#051a11]"
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Applied to Composition Table</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Apply Proposal to Composition Table</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <span className="text-[10px] text-emerald-400/60 block px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 p-2 rounded-xl bg-emerald-950/40 w-fit">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Formulation assistant is analyzing project data…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-black/30 border-t border-emerald-800/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask formulation question, request excipient adjustments, or generate preliminary recipe..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/50 text-xs text-white placeholder:text-emerald-400/50 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
              <button
                type="submit"
                disabled={sending || !inputPrompt.trim()}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-[#051a11] flex items-center justify-center font-bold transition-all shadow-md cursor-pointer disabled:opacity-40 shrink-0"
                aria-label="Send Formulation Query"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
