"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

interface ProjectOption {
  id: number;
  title: string;
  plantName: string;
  versionTag: string;
}

interface ChatMessage {
  id: number;
  sender: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

const SUGGESTED_QUESTIONS = [
  "Summarize this research dossier.",
  "What are the major limitations?",
  "Explain the docking methodology.",
  "Which safety conclusions have weak evidence?",
  "Summarize the researcher's final conclusion.",
  "What should I pay attention to in the Bioinformatics review?",
];

export default function ReviewerAssistantPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/reviewer/assistant/projects");
        if (res.ok) {
          const data = await res.json();
          const list: ProjectOption[] = data.projects || [];
          // Deduplicate projects by id
          const uniqueList = Array.from(new Map(list.map((item) => [item.id, item])).values());
          setProjects(uniqueList);
          if (uniqueList.length > 0 && !selectedProjectId) {
            setSelectedProjectId(uniqueList[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProjects();
  }, [selectedProjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      sender: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/reviewer/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          projectId: selectedProjectId,
          message: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.conversationId) setConversationId(data.conversationId);
        if (data.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: data.message.id || Date.now() + 1,
              sender: "ASSISTANT",
              content: data.message.content,
              createdAt: data.message.createdAt || new Date().toISOString(),
            },
          ]);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "ASSISTANT",
            content: `Error: ${err.error || "Failed to generate AI response. Please retry."}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-4 w-full h-[calc(100vh-130px)] flex flex-col">
      {/* PREMIUM SCIENTIFIC BLUE HERO HEADER STRIP */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#071d3a] via-[#0b2b54] to-[#123e73] border border-blue-400/30 text-white shadow-lg shadow-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5 text-blue-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-heading font-extrabold text-white leading-tight drop-shadow-xs">
                Ask NatureAide
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                AI Peer Review
              </span>
            </div>
            <p className="text-[11px] text-blue-200/80">
              Professional Scientific Review Assistant
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-xs text-blue-200 font-semibold whitespace-nowrap">Dossier:</span>
          <select
            value={selectedProjectId || ""}
            onChange={(e) => {
              setSelectedProjectId(Number(e.target.value));
              setMessages([]);
              setConversationId(null);
            }}
            className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 text-xs font-semibold text-white outline-none focus:bg-[#0b2b54] backdrop-blur-md cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="text-slate-900 bg-white">
                {p.plantName} ({p.title})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CHAT MESSAGES CONTAINER */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {/* Welcome Banner */}
        {messages.length === 0 && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center max-w-xl mx-auto space-y-4 my-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-sm text-slate-900">
                Grounded Peer Review Assistance
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask specific questions about the selected dossier{" "}
                <span className="font-bold text-slate-800">
                  {selectedProject?.plantName ? `(${selectedProject.plantName})` : ""}
                </span>
                . Together AI analyzes the verified literature, screened compounds, docking runs, and safety profiles.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="pt-2 space-y-1.5 text-left">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Suggested Review Queries:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="p-2.5 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-left text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    &quot;{q}&quot;
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-2">
              Note: AI assists in evidence inspection only. Professional approval decisions must always be made by credentialed reviewers.
            </p>
          </div>
        )}

        {/* Render Conversation Messages */}
        {messages.map((m) => {
          const isUser = m.sender === "USER";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 border border-slate-200 text-blue-600"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-4xl p-4 rounded-2xl text-xs leading-relaxed space-y-1 shadow-2xs ${
                  isUser
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-line"
                }`}
              >
                <p>{m.content}</p>
                <span
                  className={`text-[9px] block text-right ${
                    isUser ? "text-blue-200" : "text-slate-400"
                  }`}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 rounded-tl-none flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Analyzing research dossier with Together AI...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question about the research dossier (methodology, limitations, safety...)"
          className="flex-1 px-3 py-2 text-xs text-slate-800 outline-none bg-slate-50 focus:bg-white rounded-xl border border-slate-200 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

