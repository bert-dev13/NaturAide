"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Square,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Atom,
  FlaskConical,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Loader2,
  FolderGit2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ProjectOption {
  id: number;
  title: string;
  status: string;
  currentStage: string;
  plantName: string;
  plantScientificName?: string | null;
}

interface ConversationItem {
  id: number;
  title: string;
  projectId?: number | null;
  projectTitle?: string | null;
  plantName?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SourceReference {
  title: string;
  authors?: string;
  year?: number;
  journal?: string;
  pmid?: string;
  doi?: string;
  url?: string;
}

interface ChatMessage {
  id: number;
  sender: "USER" | "ASSISTANT";
  content: string;
  metadata?: {
    model?: string;
    sources?: SourceReference[];
    projectId?: number | null;
    plantName?: string | null;
    generatedAt?: string;
  } | null;
  createdAt?: string;
}

const STARTER_PROMPTS = [
  {
    title: "Summarize my Ampalaya research",
    prompt: "Summarize my Ampalaya research findings, active compounds, and current validation stage.",
  },
  {
    title: "Explain my molecular docking results",
    prompt: "Explain my molecular docking results, predicted binding affinities, and receptor interactions.",
  },
  {
    title: "What are the limitations of this study?",
    prompt: "What are the main scientific limitations and evidence gaps in my current research dossier?",
  },
  {
    title: "Review my formulation safety evidence",
    prompt: "Review my formulation extract parameters and summarize preclinical toxicological safety evidence.",
  },
  {
    title: "Help interpret my research findings",
    prompt: "Help interpret the pharmacological relevance of my screening results and docking scores.",
  },
];

export default function ResearcherAssistantClient({
  initialProjects = [],
}: {
  initialProjects: ProjectOption[];
}) {
  // State: Projects for context
  const [projects, setProjects] = useState<ProjectOption[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    initialProjects[0]?.id || null
  );

  // State: Conversations & Active Chat
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  // State: Input & Generation
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // State: Conversation management (menu, rename)
  const [convMenuOpenId, setConvMenuOpenId] = useState<number | null>(null);
  const [editingConvId, setEditingConvId] = useState<number | null>(null);
  const [editTitleText, setEditTitleText] = useState("");

  // State: Mobile drawer
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      try {
        setLoadingConversations(true);
        const res = await fetch("/api/researcher/assistant/conversations");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setConversations(data.conversations || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        setLoadingConversations(false);
      }
    }
    loadConversations();
  }, []);

  // Fetch projects if not provided
  useEffect(() => {
    if (projects.length === 0) {
      fetch("/api/researcher/assistant/projects")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.projects) {
            setProjects(data.projects);
            if (!selectedProjectId && data.projects.length > 0) {
              setSelectedProjectId(data.projects[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [projects.length, selectedProjectId]);

  // Load messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const res = await fetch(`/api/researcher/assistant/conversations/${activeConvId}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMessages(data.messages || []);
            if (data.conversation?.projectId) {
              setSelectedProjectId(data.conversation.projectId);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();
  }, [activeConvId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputMessage]);

  // Close conversation menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setConvMenuOpenId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Start new conversation
  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputMessage("");
    setMobileDrawerOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isGenerating) return;

    setInputMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Optimistically append user message
    const tempUserMsgId = Date.now();
    const newUserMsg: ChatMessage = {
      id: tempUserMsgId,
      sender: "USER",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMsg]);

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/researcher/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          projectId: selectedProjectId,
          message: textToSend,
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate response");
      }

      // Update active conversation ID if newly created
      if (!activeConvId && data.conversationId) {
        setActiveConvId(data.conversationId);
        // Refresh conversations list
        const convRes = await fetch("/api/researcher/assistant/conversations");
        if (convRes.ok) {
          const convData = await convRes.json();
          if (convData.success) setConversations(convData.conversations);
        }
      }

      // Append assistant message
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Chat error:", err);
        const errorMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: "ASSISTANT",
          content: `⚠️ Error: ${err.message || "Unable to reach Together AI inference. Please verify your connection or retry."}`,
          metadata: { model: "error" },
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  // Copy response
  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (isGenerating || messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === "USER");
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Rename conversation
  const handleSaveRename = async (convId: number) => {
    if (!editTitleText.trim()) return;
    try {
      const res = await fetch(`/api/researcher/assistant/conversations/${convId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitleText.trim() }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: editTitleText.trim() } : c))
        );
      }
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    } finally {
      setEditingConvId(null);
      setEditTitleText("");
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: number) => {
    try {
      const res = await fetch(`/api/researcher/assistant/conversations/${convId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (activeConvId === convId) {
          handleStartNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Helper: Format relative timestamp
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / 3600000);
      if (diffHours < 24 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  // Render inline scientific provenance badges & markdown text
  const renderMessageContent = (content: string) => {
    // Regex for provenance tags: [LITERATURE], [PREDICTED], [FORMULATION], [INTERPRETATION], [EXPERIMENTAL]
    const provenanceRegex = /\[(LITERATURE|PREDICTED|FORMULATION|INTERPRETATION|EXPERIMENTAL)\]/g;

    // Split text into paragraphs
    const paragraphs = content.split("\n\n");

    return (
      <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-[#131b17]">
        {paragraphs.map((para, pIdx) => {
          // Check for bullet lists
          if (para.startsWith("- ") || para.startsWith("* ") || /^\d+\.\s/.test(para)) {
            const items = para.split("\n").filter((l) => l.trim().length > 0);
            return (
              <ul key={pIdx} className="space-y-1.5 pl-3 list-disc list-inside">
                {items.map((item, iIdx) => {
                  const cleaned = item.replace(/^[-*]\s+|\d+\.\s+/, "");
                  return <li key={iIdx}>{renderFormattedInline(cleaned)}</li>;
                })}
              </ul>
            );
          }

          // Check for headers (e.g. ### Header)
          if (para.startsWith("### ")) {
            return (
              <h4 key={pIdx} className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20] pt-1">
                {para.replace(/^###\s+/, "")}
              </h4>
            );
          }

          return <p key={pIdx}>{renderFormattedInline(para)}</p>;
        })}
      </div>
    );
  };

  const renderFormattedInline = (text: string) => {
    // Replace markdown bold **text** and inline provenance tags
    const tokens = text.split(/(\*\*.*?\*\*|\[LITERATURE\]|\[PREDICTED\]|\[FORMULATION\]|\[INTERPRETATION\]|\[EXPERIMENTAL\]|`.*?`)/g);

    return tokens.map((token, idx) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return (
          <strong key={idx} className="font-extrabold text-[#0f2c20]">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded-md bg-[#edf2ee] text-[#0f2c20] font-mono text-[11px] font-bold">
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token === "[LITERATURE]") {
        return (
          <span key={idx} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-blue-50 text-blue-800 border border-blue-200">
            <BookOpen className="w-2.5 h-2.5 text-blue-600" />
            LITERATURE
          </span>
        );
      }
      if (token === "[PREDICTED]") {
        return (
          <span key={idx} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-purple-50 text-purple-800 border border-purple-200">
            <Atom className="w-2.5 h-2.5 text-purple-600" />
            PREDICTED
          </span>
        );
      }
      if (token === "[FORMULATION]") {
        return (
          <span key={idx} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
            <FlaskConical className="w-2.5 h-2.5 text-amber-600" />
            FORMULATION
          </span>
        );
      }
      if (token === "[INTERPRETATION]") {
        return (
          <span key={idx} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
            INTERPRETATION
          </span>
        );
      }
      if (token === "[EXPERIMENTAL]") {
        return (
          <span key={idx} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-teal-50 text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-teal-600" />
            EXPERIMENTAL
          </span>
        );
      }
      return <span key={idx}>{token}</span>;
    });
  };

  // Selected project object
  const activeProject = projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <div className="w-full h-[calc(100vh-6rem)] min-h-[620px] flex rounded-3xl bg-white border border-[#dde6df] shadow-xs overflow-hidden relative">
      {/* ============================================================== */}
      {/* 1. LEFT PANEL: CONVERSATION HISTORY (~25%)                     */}
      {/* ============================================================== */}
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-72 xl:w-80 bg-[#fbfdfb] border-r border-[#dde6df] flex flex-col justify-between transition-transform duration-300 shrink-0 ${
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top: New Chat Action */}
        <div className="p-3.5 sm:p-4 border-b border-[#edf2ee] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-emerald-700" />
              </span>
              <span className="font-heading font-extrabold text-sm text-[#0f2c20]">
                Research Chat
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#78997f] hover:text-[#0f2c20]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-bold transition-all shadow-2xs hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Research Chat</span>
          </button>
        </div>

        {/* Middle: Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1">
          <span className="px-2 pb-1 block text-[10px] font-mono font-black uppercase tracking-wider text-[#78997f]">
            Recent Conversations
          </span>

          {loadingConversations ? (
            <div className="py-8 text-center text-xs text-[#78997f] space-y-2">
              <Loader2 className="w-4 h-4 animate-spin mx-auto text-emerald-600" />
              <span>Loading history...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center px-4 space-y-1">
              <p className="text-xs font-semibold text-[#0f2c20]">No conversations yet</p>
              <p className="text-[11px] text-[#78997f]">
                Ask NatureAide a question to start your first research session.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConvId === conv.id;
              const isEditing = editingConvId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`group relative rounded-xl transition-all ${
                    isActive
                      ? "bg-emerald-50/80 border border-emerald-300/80 text-[#0f2c20]"
                      : "hover:bg-[#f3f7f4] text-[#475550]"
                  }`}
                >
                  {isEditing ? (
                    <div className="p-2 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editTitleText}
                        onChange={(e) => setEditTitleText(e.target.value)}
                        className="flex-1 px-2 py-1 rounded-lg border border-emerald-400 bg-white text-xs font-bold text-[#0f2c20] outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(conv.id);
                          if (e.key === "Escape") setEditingConvId(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(conv.id)}
                        className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingConvId(null)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveConvId(conv.id);
                          setMobileDrawerOpen(false);
                        }}
                        className="flex-1 text-left min-w-0 pr-2 cursor-pointer"
                      >
                        <span className="block text-xs font-bold truncate text-[#0f2c20]">
                          {conv.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#78997f] mt-0.5">
                          {conv.plantName && (
                            <span className="font-semibold truncate max-w-[120px] text-emerald-800">
                              {conv.plantName} ·
                            </span>
                          )}
                          <span>{formatTime(conv.updatedAt)}</span>
                        </div>
                      </button>

                      {/* Dropdown menu trigger */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConvMenuOpenId(convMenuOpenId === conv.id ? null : conv.id);
                          }}
                          className="p-1 rounded-md text-[#78997f] hover:text-[#0f2c20] hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {convMenuOpenId === conv.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-white border border-[#dde6df] shadow-lg py-1 z-30 animate-in fade-in zoom-in-95"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setEditingConvId(conv.id);
                                setEditTitleText(conv.title);
                                setConvMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#0f2c20] hover:bg-[#f6f8f6]"
                            >
                              <Edit2 className="w-3 h-3 text-[#78997f]" />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteConversation(conv.id);
                                setConvMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom: Grounded Together AI badge */}
        <div className="p-3 border-t border-[#edf2ee] bg-[#f8faf8] text-[11px] text-[#78997f] flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-[#0f2c20]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Together AI Inference</span>
          </div>
          <span className="font-mono text-[10px]">Server-side</span>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. RIGHT PANEL: CHAT WORKSPACE (~75%)                          */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col justify-between min-w-0 bg-white">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#dde6df] flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-xl border border-[#dde6df] text-[#0f2c20] hover:bg-[#f6f8f6]"
              aria-label="Open conversation history"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0f2c20] to-[#1e5c44] text-emerald-300 flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20] tracking-tight">
                  Ask NatureAide
                </h1>
                <p className="text-[11px] text-[#78997f] hidden sm:block">
                  AI Scientific Research Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Research Context Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#475550] hidden md:inline">
              Research Context:
            </span>
            <div className="relative">
              <select
                value={selectedProjectId || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  setSelectedProjectId(val);
                }}
                className="pl-3 pr-8 py-1.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] hover:bg-white text-xs font-bold text-[#0f2c20] outline-none focus:border-emerald-500 cursor-pointer shadow-2xs transition-all appearance-none max-w-[240px] truncate"
              >
                <option value="">General (No Project Context)</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.plantName} — {proj.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#78997f] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {activeProject && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>{activeProject.plantName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center space-y-2 text-[#78997f] text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Retrieving grounded research history...</span>
            </div>
          ) : messages.length === 0 ? (
            /* EMPTY STATE */
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center py-8 space-y-6">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-xs">
                <Sparkles className="w-7 h-7 text-emerald-700" />
              </div>

              <div className="space-y-1.5">
                <h2 className="font-heading font-extrabold text-2xl text-[#0f2c20] tracking-tight">
                  Ask NatureAide
                </h2>
                <p className="text-xs sm:text-sm text-[#475550] leading-relaxed">
                  Your AI research assistant for medicinal plant research, in-silico screening, molecular docking, and formulation evidence.
                </p>
                {activeProject && (
                  <p className="text-xs text-emerald-800 font-bold bg-emerald-50/80 px-3 py-1 rounded-full inline-block border border-emerald-200">
                    Grounded in: {activeProject.plantName} ({activeProject.title})
                  </p>
                )}
              </div>

              {/* Starter Prompts */}
              <div className="w-full space-y-2 pt-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#78997f] block">
                  Suggested Research Inquiries
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {STARTER_PROMPTS.map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(starter.prompt)}
                      className="p-3 rounded-2xl bg-[#faf9f5] hover:bg-emerald-50/70 border border-[#dde6df] hover:border-emerald-300 text-xs font-bold text-[#0f2c20] transition-all text-left shadow-2xs group flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{starter.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#78997f] group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MESSAGES LIST */
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg) => {
                const isUser = msg.sender === "USER";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0f2c20] to-[#1e5c44] text-emerald-300 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 sm:p-5 shadow-2xs ${
                        isUser
                          ? "bg-[#0f2c20] text-white rounded-tr-xs"
                          : "bg-white border border-[#dde6df] rounded-tl-xs space-y-3"
                      }`}
                    >
                      {isUser ? (
                        <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      ) : (
                        <>
                          {/* Assistant content formatted */}
                          {renderMessageContent(msg.content)}

                          {/* Sources Block if present */}
                          {msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                            <div className="pt-3 border-t border-[#edf2ee] space-y-2">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0f2c20]">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Verified Research Sources</span>
                              </div>
                              <div className="space-y-1.5">
                                {msg.metadata.sources.map((src, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2.5 rounded-xl bg-[#faf9f5] border border-[#dde6df] text-xs space-y-0.5"
                                  >
                                    <p className="font-bold text-[#0f2c20] leading-snug">
                                      {src.title}
                                    </p>
                                    <p className="text-[11px] text-[#52796f]">
                                      {src.authors} {src.year ? `(${src.year})` : ""}{" "}
                                      {src.journal ? `· ${src.journal}` : ""}
                                    </p>
                                    <div className="flex items-center gap-3 pt-0.5 text-[10px] font-mono">
                                      {src.pmid && (
                                        <a
                                          href={`https://pubmed.ncbi.nlm.nih.gov/${src.pmid}/`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-700 hover:underline flex items-center gap-0.5"
                                        >
                                          <span>PMID: {src.pmid}</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                      {src.doi && (
                                        <a
                                          href={`https://doi.org/${src.doi}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-800 hover:underline flex items-center gap-0.5"
                                        >
                                          <span>DOI: {src.doi}</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Toolbar on Assistant Message */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#edf2ee] text-[11px] text-[#78997f]">
                            <div className="flex items-center gap-2">
                              {msg.metadata?.model && (
                                <span className="font-mono text-[10px] bg-[#f6f8f6] px-2 py-0.5 rounded-md border border-[#dde6df]">
                                  {msg.metadata.model}
                                </span>
                              )}
                              {selectedProjectId && (
                                <Link
                                  href={`/researcher/projects/${selectedProjectId}`}
                                  className="text-emerald-800 hover:underline flex items-center gap-0.5 font-bold"
                                >
                                  <span>View Project Workspace</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </Link>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#475550] hover:text-[#0f2c20] transition-colors"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-[#0f2c20] text-emerald-200 flex items-center justify-center shrink-0 mt-1 font-bold text-xs shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Generating Animation */}
              {isGenerating && (
                <div className="flex items-start gap-3 justify-start animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0f2c20] to-[#1e5c44] text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-4 rounded-3xl bg-white border border-[#dde6df] text-xs font-bold text-[#52796f] flex items-center gap-2 shadow-2xs">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Analyzing project records & synthesizing scientific evidence...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Sticky Composer */}
        <div className="p-4 sm:p-5 border-t border-[#dde6df] bg-white space-y-2">
          {/* Quick Context Indicator */}
          <div className="flex items-center justify-between text-[11px] text-[#78997f] max-w-3xl mx-auto px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                {activeProject
                  ? `Grounding in: ${activeProject.plantName} — ${activeProject.title}`
                  : "General Phytochemical & Computational Mode"}
              </span>
            </div>
            {messages.length > 0 && !isGenerating && (
              <button
                type="button"
                onClick={handleRegenerate}
                className="hover:text-[#0f2c20] font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            )}
          </div>

          {/* Composer Input Area */}
          <div className="max-w-3xl mx-auto relative rounded-2xl border border-[#dde6df] focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-[#faf9f5] transition-all p-2 flex items-end gap-2 shadow-2xs">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                activeProject
                  ? `Ask about ${activeProject.plantName} research, docking affinities, formulation, or safety...`
                  : "Ask about medicinal plants, secondary metabolites, molecular docking, or formulation..."
              }
              disabled={isGenerating}
              className="flex-1 bg-transparent border-0 outline-none resize-none text-xs sm:text-sm text-[#0f2c20] placeholder-[#78997f] p-2 max-h-[160px] min-h-[40px] leading-relaxed"
            />

            <div className="flex items-center gap-1.5 shrink-0 pb-1">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
                  title="Stop generation"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#164533] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all cursor-pointer shadow-xs"
                  title="Send message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] text-[#78997f] max-w-2xl mx-auto">
            Ask NatureAide is an evidence-based research assistant. Predicted binding scores reflect in-silico models and do not replace clinical advice.
          </p>
        </div>
      </main>
    </div>
  );
}

