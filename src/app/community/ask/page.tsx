"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import {
  Send,
  Loader2,
  ShieldAlert,
  Leaf,
  Info,
  Hospital,
  ArrowRight,
  ShieldCheck,
  Pill,
  Sparkles,
  X,
  Trash2,
  Coffee,
  BookOpen,
  Package,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { getScreeningSeverity } from "@/lib/safety-rules";

interface ContextualAction {
  label: string;
  query?: string;
  href?: string;
  isExternal?: boolean;
}

interface MetricItem {
  icon: "leaf" | "coffee" | "book" | "package" | "shield" | "pill";
  label: string;
  value: string;
}

interface ContextCard {
  type: "PLANT" | "PRODUCT" | "PREPARATION" | "SAFETY" | "EVIDENCE" | "NONE" | "GENERAL";
  title: string;
  subtitle?: string;
  entityId?: string;
  entitySlug?: string;
  metrics?: MetricItem[];
  actions?: ContextualAction[];
}

interface ChatMessage {
  id: number;
  sender: "USER" | "ASSISTANT";
  content: string;
  card?: ContextCard | null;
  createdAt?: string;
}

interface ActiveChatContext {
  type: "PLANT" | "PRODUCT" | "PREPARATION" | "NONE";
  id?: string;
  slug?: string;
  name?: string;
  scientificName?: string;
  brandName?: string;
  manufacturer?: string;
  dosageForm?: string;
}

const STARTER_GUIDED_CARDS = [
  {
    icon: "leaf",
    title: "Find a Medicinal Plant",
    subtitle: "Learn about the 10 DOH/PITAHC medicinal plants",
    query: "Tell me about the 10 PITAHC medicinal plants",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    icon: "coffee",
    title: "Traditional Preparation",
    subtitle: "Step-by-step decoctions, poultices & herbal teas",
    query: "How are medicinal plants traditionally prepared?",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    icon: "shield",
    title: "Safety & Precautions",
    subtitle: "Contraindications, sensitive populations & advice",
    query: "What safety precautions should I know before using herbal remedies?",
    color: "bg-rose-100 text-rose-800 border-rose-200",
  },
  {
    icon: "book",
    title: "Research & Evidence",
    subtitle: "Clinical trials and scientific findings from PubMed",
    query: "What scientific research is available in NaturAide?",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  {
    icon: "package",
    title: "Herbal Products",
    subtitle: "Registered commercial herbal medicines & supplements",
    query: "What commercial herbal products are registered in NaturAide?",
    color: "bg-teal-100 text-teal-800 border-teal-200",
  },
];

function AskNaturAideContent() {
  const searchParams = useSearchParams();
  const plantParam = searchParams.get("plant");
  const productParam = searchParams.get("product");
  const prepParam = searchParams.get("preparation");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [activeContext, setActiveContext] = useState<ActiveChatContext | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [screeningStatus, setScreeningStatus] = useState<string | null>(null);
  const [screeningObj, setScreeningObj] = useState<any>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchChatAndScreening = async () => {
      try {
        const queryArgs = new URLSearchParams();
        if (plantParam) queryArgs.set("plant", plantParam);
        if (productParam) queryArgs.set("product", productParam);
        if (prepParam) queryArgs.set("preparation", prepParam);

        const url = `/api/community/chat${queryArgs.toString() ? `?${queryArgs.toString()}` : ""}`;

        const [chatRes, screeningRes] = await Promise.all([
          fetch(url),
          fetch("/api/community/screening"),
        ]);
        const chatData = await chatRes.json();
        const screeningData = await screeningRes.json();

        if (chatData.success) {
          setConversationId(chatData.conversationId);
          setMessages(chatData.messages || []);
          if (chatData.activeContext) {
            setActiveContext(chatData.activeContext);
          }
        }
        if (screeningData.success && screeningData.screening) {
          setScreeningStatus(screeningData.screening.evaluationResult);
          setScreeningObj(screeningData.screening);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchChatAndScreening();
  }, [plantParam, productParam, prepParam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage("");
    setIsSending(true);

    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: tempId, sender: "USER", content: text },
    ]);

    try {
      const res = await fetch("/api/community/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
          plantId: activeContext?.type === "PLANT" ? activeContext.id : undefined,
          productId: activeContext?.type === "PRODUCT" ? activeContext.id : undefined,
          preparationId: activeContext?.type === "PREPARATION" ? activeContext.id : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          data.userMessage,
          data.assistantMessage,
        ]);
        if (data.activeContext) {
          setActiveContext(data.activeContext);
        }
      } else {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          {
            id: Date.now() + 1,
            sender: "ASSISTANT",
            content:
              "I don’t currently have verified information about that in the NaturAide knowledge base.",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to send chat message:", err);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        {
          id: Date.now() + 1,
          sender: "ASSISTANT",
          content:
            "Network connection error. Please verify your connection and try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/community/chat", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setConversationId(data.conversationId);
        setMessages([]);
        setActiveContext(null);
        setShowClearModal(false);
      }
    } catch (err) {
      console.error("Failed to clear chat:", err);
    } finally {
      setClearing(false);
    }
  };

  const clearActiveContext = () => {
    setActiveContext(null);
  };

  const renderMetricIcon = (iconName: string) => {
    switch (iconName) {
      case "leaf":
        return <Leaf className="w-3.5 h-3.5 text-emerald-700" />;
      case "coffee":
        return <Coffee className="w-3.5 h-3.5 text-amber-700" />;
      case "book":
        return <BookOpen className="w-3.5 h-3.5 text-indigo-700" />;
      case "package":
        return <Package className="w-3.5 h-3.5 text-teal-700" />;
      case "pill":
        return <Pill className="w-3.5 h-3.5 text-cyan-700" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
    }
  };

  // Render assistant card with compact metric pills and interactive action buttons
  const renderAssistantCard = (card: ContextCard) => {
    return (
      <div className="mt-3 p-3.5 rounded-2xl bg-[#faf7f2] border border-[#dde6df] space-y-3">
        {/* Title */}
        {card.title && (
          <div className="border-b border-[#dde6df]/80 pb-1.5 flex items-center justify-between gap-2">
            <span className="font-heading font-black text-xs text-[#0f2c20] tracking-tight truncate">
              {card.title}
            </span>
            {card.type && (
              <span className="px-2 py-0.5 rounded-full bg-white border border-[#dde6df] text-[9px] font-extrabold uppercase tracking-wider text-[#52796f] shrink-0">
                {card.type}
              </span>
            )}
          </div>
        )}

        {/* Compact Metric Pills */}
        {card.metrics && card.metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {card.metrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-white border border-[#dde6df] space-y-0.5"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#52796f] uppercase">
                  {renderMetricIcon(metric.icon)}
                  <span className="truncate">{metric.label}</span>
                </div>
                <p className="font-black text-[#0f2c20] text-xs truncate">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Contextual Options */}
        {card.actions && card.actions.length > 0 && (
          <div className="space-y-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-[#52796f] uppercase tracking-wider block">
              Contextual options:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {card.actions.map((action, idx) => {
                if (action.href) {
                  return (
                    <Link
                      key={idx}
                      href={action.href}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-[11px] font-black transition-all active:scale-95 shadow-2xs"
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-300" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(action.query || action.label)}
                    disabled={isSending}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 active:scale-95 text-[#0f2c20] text-[11px] font-bold border border-[#dde6df] hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                  >
                    [ {action.label} ]
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFormattedMessage = (content: string, card?: ContextCard | null) => {
    const hasFacilityLink =
      content.includes("/community/facilities") ||
      content.toLowerCase().includes("facility finder") ||
      content.toLowerCase().includes("healthcare facility");
    const hasScreeningLink = content.includes("/community/screening");

    const parts = content.split(/(\*\*.*?\*\*)/g);

    return (
      <div className="space-y-2">
        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
          {parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={index} className="font-extrabold text-[#0f2c20]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>

        {card && renderAssistantCard(card)}

        {hasFacilityLink && (
          <div className="pt-2">
            <Link
              href="/community/facilities"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Hospital className="w-4 h-4 text-emerald-200" />
              <span>Find Nearest Healthcare Facility</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {hasScreeningLink && (
          <div className="pt-2">
            <Link
              href="/community/screening"
              className="w-full py-2.5 px-4 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Complete Health Safety Screening</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    );
  };

  const userMessagesCount = messages.filter((m) => m.sender === "USER").length;

  return (
    <div className="flex flex-col min-h-screen relative bg-[#faf7f2] text-[#0f2c20]">
      {/* 1. App Header with Clear Chat action */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#dde6df]/80 px-4 py-2.5 transition-all">
        <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-2">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#faf7f2] hover:bg-emerald-50 active:scale-95 text-xs font-extrabold text-[#1e5c44] border border-[#dde6df] transition-all shadow-2xs"
            aria-label="Back to Community"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180 text-emerald-700" />
            <span>Community</span>
          </Link>

          <div className="text-center">
            <h1 className="font-heading font-black text-sm text-[#0f2c20] uppercase tracking-wide">
              Ask NaturAide
            </h1>
            <p className="text-[10px] text-[#52796f] font-semibold">
              Guided Herbal Information Assistant
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            disabled={messages.length === 0}
            title="Clear Chat"
            aria-label="Clear Chat"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-2xs bg-[#faf7f2] border border-[#dde6df] text-[#52796f] hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Chat Stream */}
      <div className="flex-1 px-3.5 sm:px-6 pt-3 pb-36 space-y-4 max-w-2xl mx-auto w-full">
        {/* Healthcare Educational Disclaimer Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-[#dde6df] text-slate-800 text-xs shadow-2xs">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-snug text-[#3d4a45] text-[11px] sm:text-xs">
            <strong>Educational Notice:</strong> NaturAide answers using verified MySQL records and is not intended to diagnose, prescribe, or replace professional medical care.
          </p>
        </div>

        {screeningStatus === "PROFESSIONAL_GUIDANCE_REQUIRED" && (() => {
          const isSevere = screeningObj && getScreeningSeverity(screeningObj) === "severe";

          if (isSevere) {
            return (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 border-l-4 border-l-rose-600 text-rose-950 text-xs shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-950">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                  <span>Severe Health Caution Active</span>
                </div>
                <p className="leading-relaxed text-[11px] text-rose-900">
                  Based on reported symptoms or high-risk contraindications, herbal recommendations are restricted. Ask NaturAide provides educational facts only.
                </p>
                <div>
                  <Link
                    href="/community/facilities"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-800 hover:text-rose-950 underline"
                  >
                    <span>Find Nearby Healthcare Facilities →</span>
                  </Link>
                </div>
              </div>
            );
          }

          return (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 text-amber-950 text-xs shadow-2xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Professional Care Guidance Active</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-900">
                Based on your screening responses, personalized herbal recommendations are restricted. Ask NaturAide will only provide general educational facts.
              </p>
            </div>
          );
        })()}

        {/* ACTIVE CONTEXT FOCUS BANNER */}
        {activeContext && activeContext.type === "PLANT" && activeContext.name && (
          <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-300 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Leaf className="w-4.5 h-4.5 text-emerald-200" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 flex items-center gap-1">
                    <span>Active Plant in Focus</span>
                  </div>
                  <h3 className="font-heading font-black text-sm sm:text-base text-[#0f2c20]">
                    {activeContext.name}{" "}
                    {activeContext.scientificName && (
                      <span className="font-normal italic text-xs text-[#52796f]">
                        ({activeContext.scientificName})
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={clearActiveContext}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                title="Clear plant focus"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                `How is ${activeContext.name} prepared?`,
                `What about its safety?`,
                `What products contain ${activeContext.name}?`,
                `Show me the research`,
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  disabled={isSending}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-200 text-xs text-emerald-950 font-bold transition-all active:scale-95 text-left cursor-pointer shadow-2xs"
                >
                  &ldquo;{chip}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {activeContext && activeContext.type === "PRODUCT" && activeContext.name && (
          <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-teal-50 via-cyan-50 to-white border-2 border-teal-300 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Pill className="w-4.5 h-4.5 text-teal-200" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-teal-800 flex items-center gap-1">
                    <span>Active Product in Focus</span>
                  </div>
                  <h3 className="font-heading font-black text-sm sm:text-base text-[#0f2c20]">
                    {activeContext.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={clearActiveContext}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                title="Clear product focus"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                `What is its main ingredient?`,
                `Is registration information available?`,
                `What research supports this product?`,
                `What are its warnings?`,
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  disabled={isSending}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-teal-100 border border-teal-200 text-xs text-teal-950 font-bold transition-all active:scale-95 text-left cursor-pointer shadow-2xs"
                >
                  &ldquo;{chip}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. CHAT HOME: Redesigned Empty State with 5 Guided Starter Cards */}
        {userMessagesCount === 0 && !loadingHistory && (
          <div className="space-y-4 py-2 animate-in fade-in duration-300">
            {/* Main Welcome Hero Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0f2c20] via-[#164a35] to-[#0a1e16] text-white shadow-md relative overflow-hidden space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-emerald-400/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Verified Herbal Information Assistant</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-white leading-tight">
                Ask NaturAide
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Ask about medicinal plants, preparation, safety, research, or herbal products. All answers are grounded strictly in the verified NaturAide knowledge base.
              </p>
            </div>

            {/* 5 Guided Starter Cards */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-[#52796f] uppercase tracking-wider block px-1">
                Guided Starter Topics:
              </span>

              <div className="space-y-2">
                {STARTER_GUIDED_CARDS.map((card, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(card.query)}
                    disabled={isSending}
                    className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-[#dde6df] hover:border-emerald-500 shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] group cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                      >
                        {renderMetricIcon(card.icon)}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-[#0f2c20] text-xs sm:text-sm block font-heading font-black">
                          {card.title}
                        </strong>
                        <p className="text-[11px] text-[#52796f] truncate mt-0.5 font-medium">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#78997f] group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1 text-center">
              <p className="text-xs font-bold text-[#52796f]">
                Or ask NaturAide below…
              </p>
            </div>
          </div>
        )}

        {/* 4. Chat Message History */}
        {loadingHistory ? (
          <div className="p-8 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-[#52796f]">Loading chat history...</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {messages.map((msg) => {
              const isUser = msg.sender === "USER";
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 mb-1 shadow-2xs">
                      <Leaf className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] sm:max-w-[82%] rounded-3xl p-4 sm:p-5 shadow-2xs leading-relaxed ${
                      isUser
                        ? "bg-[#0f2c20] text-white rounded-br-xs"
                        : "bg-white border border-[#dde6df] text-[#131b17] rounded-bl-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    ) : (
                      renderFormattedMessage(msg.content, msg.card)
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-[#0f2c20] flex items-center justify-center text-emerald-200 shrink-0 mb-1 text-[10px] font-extrabold shadow-2xs">
                      You
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-[#52796f] pl-9 py-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="font-bold">NaturAide is reviewing verified MySQL records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 5. Fixed Message Composer docked above bottom bar */}
      <div className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-30 bg-[#faf7f2]/95 backdrop-blur-md border-t border-[#dde6df] p-3 sm:p-4">
        <div className="max-w-2xl mx-auto w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                activeContext && activeContext.type !== "NONE" && activeContext.name
                  ? `Ask about ${activeContext.name}...`
                  : "Ask about a plant or herbal product..."
              }
              disabled={isSending}
              className="flex-1 bg-white text-[#0f2c20] placeholder-[#6b7c76] text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-2xl border border-[#dde6df] shadow-2xs focus:outline-none focus:ring-3 focus:ring-emerald-400/30 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              aria-label="Send question"
              className="w-11 h-11 rounded-2xl bg-[#0f2c20] hover:bg-[#1e5c44] disabled:opacity-40 text-white flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-emerald-300" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 6. Clear Chat Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-xl space-y-4 border border-[#dde6df]">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-heading font-black text-base text-[#0f2c20]">
                Clear this conversation?
              </h3>
              <p className="text-xs text-[#52796f] leading-relaxed">
                This will clear the current chat and start a new conversation. Your saved remedies, screening results, and account profile will not be deleted.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="py-2.5 px-4 rounded-xl bg-[#faf7f2] hover:bg-[#edf2ee] text-xs font-bold text-[#0f2c20] border border-[#dde6df] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                disabled={clearing}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {clearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Clear Chat</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AskNaturAidePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        </div>
      }
    >
      <AskNaturAideContent />
    </Suspense>
  );
}
