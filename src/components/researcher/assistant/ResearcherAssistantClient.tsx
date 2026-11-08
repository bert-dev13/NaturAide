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
  ChevronDown,
  Paperclip,
  Upload,
  X,
  Copy,
  Check,
  Trash2,
  BookOpen,
  ArrowRight,
} from "lucide-react";

interface ProjectOption {
  id: number;
  title: string;
  status: string;
  currentStage: string;
  plantName: string;
  plantScientificName?: string | null;
  hasManuscript?: boolean;
  manuscriptFileName?: string | null;
}

interface AttachedPaper {
  fileName: string;
  fileType: string;
  fileSize?: number;
  pageCount?: number;
  characterCount?: number;
  preview?: string;
  fullText: string;
  sections?: Array<{ heading: string; preview: string }>;
}

interface ChatMessage {
  id: number;
  sender: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  attachedPaper?: {
    fileName: string;
    pageCount?: number;
  };
}

const DOSSIER_SUGGESTED_QUESTIONS = [
  "Summarize this research dossier.",
  "Explain my molecular docking results.",
  "What are the major limitations and evidence gaps?",
  "Review my formulation safety evidence.",
  "Help interpret my research findings.",
  "What should I review before submitting to reviewers?",
];

const PAPER_SUGGESTED_QUESTIONS = [
  "Summarize this research paper.",
  "Explain the methodology and experimental design.",
  "What are the primary findings and results?",
  "What limitations or safety concerns are identified?",
  "Summarize the author's final conclusion.",
  "Analyze the bioactive phytochemicals discussed.",
];

export default function ResearcherAssistantClient({
  initialProjects = [],
}: {
  initialProjects: ProjectOption[];
}) {
  const [projects, setProjects] = useState<ProjectOption[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    initialProjects[0]?.id || null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

  // Attached Paper state
  const [attachedPaper, setAttachedPaper] = useState<AttachedPaper | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingManuscript, setLoadingManuscript] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [clearingChat, setClearingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch projects if not provided or to refresh
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/researcher/assistant/projects");
        if (res.ok) {
          const data = await res.json();
          const list: ProjectOption[] = data.projects || [];
          const uniqueList = Array.from(new Map(list.map((item) => [item.id, item])).values());
          setProjects(uniqueList);
          if (uniqueList.length > 0 && !selectedProjectId) {
            setSelectedProjectId(uniqueList[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    }

    if (projects.length === 0) {
      loadProjects();
    }
  }, [selectedProjectId, projects.length]);

  // Auto-scroll on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Upload custom file (PDF, DOCX, TXT, MD)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingFile(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedProjectId) {
        formData.append("projectId", String(selectedProjectId));
      }

      const res = await fetch("/api/reviewer/assistant/upload-paper", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload and parse paper.");
      }

      setAttachedPaper(data.paper);
    } catch (err: any) {
      console.error("File upload error:", err);
      setUploadError(err?.message || "Failed to parse uploaded paper.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 1-Click: Load active dossier manuscript
  const handleLoadProjectManuscript = async () => {
    if (!selectedProjectId) return;
    setLoadingManuscript(true);
    setUploadError(null);

    try {
      const res = await fetch(`/api/reviewer/assistant/project-manuscript?projectId=${selectedProjectId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load project manuscript.");
      }

      if (data.hasManuscript && data.paper) {
        setAttachedPaper(data.paper);
      } else {
        setUploadError(data.message || "Manuscript could not be read.");
      }
    } catch (err: any) {
      console.error("Manuscript load error:", err);
      setUploadError(err?.message || "Failed to load project manuscript.");
    } finally {
      setLoadingManuscript(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setInputMessage("");
    setUploadError(null);

    const userMessageId = Date.now();
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      sender: "USER",
      content: text,
      createdAt: new Date().toISOString(),
      attachedPaper: attachedPaper
        ? {
            fileName: attachedPaper.fileName,
            pageCount: attachedPaper.pageCount,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const payload: any = {
        conversationId,
        projectId: selectedProjectId,
        message: text,
      };

      if (attachedPaper && attachedPaper.fullText) {
        payload.attachedPaper = {
          fileName: attachedPaper.fileName,
          fileType: attachedPaper.fileType,
          text: attachedPaper.fullText,
          pageCount: attachedPaper.pageCount,
        };
      }

      const res = await fetch("/api/researcher/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response.");
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: data.message?.id || Date.now() + 1,
        sender: "ASSISTANT",
        content: data.message?.content || "No response received.",
        createdAt: data.message?.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        id: Date.now() + 2,
        sender: "ASSISTANT",
        content: `⚠️ **Unable to complete generation:** ${
          err?.message || "An unexpected error occurred. Please try again."
        }`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = (msgId: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const canClearChat =
    messages.length > 0 || Boolean(attachedPaper) || Boolean(conversationId) || Boolean(inputMessage.trim());

  // Clear chat: wipe local thread + detach paper; delete server conversation when present
  const handleClearChat = async () => {
    if (!canClearChat || clearingChat) return;
    if (
      messages.length > 0 &&
      typeof window !== "undefined" &&
      !window.confirm("Clear this chat? Message history will be removed.")
    ) {
      return;
    }

    setClearingChat(true);
    try {
      if (conversationId) {
        await fetch(`/api/researcher/assistant/chat?conversationId=${conversationId}`, {
          method: "DELETE",
        });
      }
    } catch (err) {
      console.error("Failed to clear chat:", err);
    } finally {
      setMessages([]);
      setConversationId(null);
      setInputMessage("");
      setAttachedPaper(null);
      setUploadError(null);
      setClearingChat(false);
    }
  };

  // Helper to format inline markdown tokens
  const renderInlineFormatted = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={idx} className="italic text-slate-700">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Helper to format assistant markdown response
  const renderMessageContent = (content: string) => {
    const paragraphs = content.split(/\n\s*\n/);

    return (
      <div className="space-y-3 text-xs leading-relaxed text-slate-800">
        {paragraphs.map((para, pIdx) => {
          const trimmed = para.trim();

          // Heading 4
          if (trimmed.startsWith("#### ")) {
            return (
              <h5 key={pIdx} className="font-bold text-xs uppercase tracking-wider text-emerald-950 pt-1">
                {trimmed.replace(/^####\s+/, "")}
              </h5>
            );
          }

          // Heading 3
          if (trimmed.startsWith("### ")) {
            return (
              <h4 key={pIdx} className="font-bold text-sm text-emerald-950 pt-1 border-b border-slate-200/60 pb-1">
                {trimmed.replace(/^###\s+/, "")}
              </h4>
            );
          }

          // Blockquote
          if (trimmed.startsWith("> ")) {
            return (
              <blockquote
                key={pIdx}
                className="pl-3 border-l-2 border-emerald-500 bg-emerald-50/50 p-2 rounded-r-lg text-slate-700 italic text-[11.5px]"
              >
                {renderInlineFormatted(trimmed.replace(/^>\s+/, ""))}
              </blockquote>
            );
          }

          // Horizontal rule
          if (trimmed === "---") {
            return <hr key={pIdx} className="border-slate-200 my-2" />;
          }

          // Bullet or numbered lists
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
            const items = trimmed.split("\n").filter((l) => l.trim().length > 0);
            return (
              <ul key={pIdx} className="space-y-1 pl-4 list-disc text-slate-700">
                {items.map((item, iIdx) => {
                  const cleaned = item.replace(/^[-*]\s+|\d+\.\s+/, "");
                  return <li key={iIdx}>{renderInlineFormatted(cleaned)}</li>;
                })}
              </ul>
            );
          }

          // Regular paragraph
          return <p key={pIdx}>{renderInlineFormatted(trimmed)}</p>;
        })}
      </div>
    );
  };

  const suggested = attachedPaper ? PAPER_SUGGESTED_QUESTIONS : DOSSIER_SUGGESTED_QUESTIONS;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex h-[calc(100vh-120px)] w-full flex-col gap-3 transition-colors ${
        isDraggingOver ? "rounded-2xl bg-emerald-50/30 ring-2 ring-emerald-400/40" : ""
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
        className="hidden"
      />

      {isDraggingOver && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-600/10 backdrop-blur-xs">
          <div className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-center shadow-lg">
            <Upload className="mx-auto mb-1.5 h-6 w-6 animate-bounce text-emerald-700" />
            <p className="text-sm font-semibold text-[#0f2c20]">Drop paper</p>
            <p className="text-[11px] text-[#6d7f76]">PDF · DOCX · TXT</p>
          </div>
        </div>
      )}

      {/* Compact hero */}
      <div className="relative shrink-0 overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                  Ask NatureAide
                </h1>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  Research AI
                </span>
              </div>
              <p className="truncate text-[11px] text-emerald-200/70">
                {selectedProject?.plantName || "Select a dossier"} · grounded Q&amp;A
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClearChat}
              disabled={!canClearChat || clearingChat}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 transition hover:border-rose-400/40 hover:bg-rose-500/20 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
              title="Clear chat"
              aria-label="Clear chat"
            >
              {clearingChat ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Clear chat
            </button>
            <div className="relative">
              <select
                value={selectedProjectId || ""}
                onChange={(e) => {
                  setSelectedProjectId(Number(e.target.value));
                  setMessages([]);
                  setConversationId(null);
                  setAttachedPaper(null);
                }}
                className="max-w-[220px] cursor-pointer appearance-none truncate rounded-xl border border-white/15 bg-white/10 py-1.5 pl-3 pr-8 text-[11px] font-semibold text-white outline-none backdrop-blur-md focus:bg-[#0f2c20]"
                title="Active dossier"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white text-slate-900">
                    {p.plantName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Manuscript quick-load */}
      {selectedProject?.hasManuscript && !attachedPaper && (
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-[#d7e4dc]/90 bg-white px-3.5 py-2 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-[#52645d]">
            <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
            <span className="truncate font-medium text-[#0f2c20]">
              {selectedProject.manuscriptFileName || "manuscript.pdf"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLoadProjectManuscript}
            disabled={loadingManuscript}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0f2c20] px-3 py-1.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-[#1e5c44] disabled:opacity-50"
          >
            {loadingManuscript ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BookOpen className="h-3.5 w-3.5" />
            )}
            Analyze paper
          </button>
        </div>
      )}

      {/* Chat surface */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4">
        {messages.length === 0 && (
          <div className="mx-auto my-2 max-w-2xl space-y-3 rounded-2xl border border-[#e6ebe7] bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] p-4 sm:p-5">
            <div className="flex items-start gap-2.5">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#0f2c20]">
                  {attachedPaper ? "Paper ready" : "Ask about your dossier"}
                </h3>
                <p className="mt-0.5 text-[11px] text-[#6d7f76]">
                  {attachedPaper
                    ? `${attachedPaper.fileName}${attachedPaper.pageCount ? ` · ${attachedPaper.pageCount}p` : ""}`
                    : selectedProject?.plantName
                      ? `${selectedProject.plantName} · upload a paper or pick a prompt`
                      : "Select a project · upload a paper"}
                </p>
              </div>
            </div>

            {!attachedPaper && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-300 hover:text-emerald-900"
              >
                {uploadingFile ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Upload paper
              </button>
            )}

            <div className="flex flex-wrap gap-1.5">
              {suggested.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#0f2c20] transition hover:border-emerald-300 hover:bg-emerald-50/60"
                >
                  {q.replace(/\.$/, "")}
                  <ArrowRight className="h-3 w-3 text-[#c5d4cb]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === "USER";
          const isCopied = copiedMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex max-w-3xl gap-2.5 ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isUser
                    ? "bg-[#0f2c20] text-emerald-200"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs ${
                  isUser
                    ? "rounded-tr-md bg-[#0f2c20] text-white"
                    : "rounded-tl-md border border-[#e6ebe7] bg-[#f8fbf9] text-[#1a2e24]"
                }`}
              >
                {isUser && msg.attachedPaper && (
                  <div className="mb-1.5 flex items-center gap-1 border-b border-emerald-800/60 pb-1.5 text-[10px] text-emerald-200">
                    <FileText className="h-3 w-3" />
                    <span className="truncate font-semibold">{msg.attachedPaper.fileName}</span>
                  </div>
                )}

                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  renderMessageContent(msg.content)
                )}

                {!isUser && (
                  <div className="mt-2 flex items-center justify-end border-t border-[#eef2ef] pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="inline-flex items-center gap-1 text-[10px] text-[#8aa094] transition hover:text-emerald-800"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="mr-auto flex max-w-md gap-2.5">
            <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-md border border-[#e6ebe7] bg-[#f8fbf9] px-3.5 py-2.5 text-[11px] text-[#52645d]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0f2c20]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                Thinking…
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {uploadError && (
        <div className="flex shrink-0 items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          <span className="inline-flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {uploadError}
          </span>
          <button type="button" onClick={() => setUploadError(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {attachedPaper && (
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[11px]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white">
              <FileText className="h-3 w-3" />
            </span>
            <span className="truncate font-semibold text-[#0f2c20]">{attachedPaper.fileName}</span>
            {attachedPaper.pageCount ? (
              <span className="shrink-0 text-[#6d7f76]">{attachedPaper.pageCount}p</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setAttachedPaper(null)}
            className="rounded-md p-1 text-emerald-800 hover:bg-emerald-100"
            title="Detach"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex shrink-0 items-end gap-2 rounded-2xl border border-[#d7e4dc] bg-white p-2 shadow-[0_1px_2px_rgba(15,44,32,0.04)] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#6d7f76] transition hover:bg-[#f6f8f6] hover:text-emerald-800"
          title="Attach paper"
        >
          {uploadingFile ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </button>

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
            attachedPaper
              ? `Ask about ${attachedPaper.fileName}…`
              : selectedProject?.plantName
                ? `Ask about ${selectedProject.plantName}…`
                : "Ask NatureAide…"
          }
          className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-1 py-2 text-xs leading-relaxed text-[#1a2e24] outline-none placeholder:text-[#8aa094]"
        />

        {canClearChat && (
          <button
            type="button"
            onClick={handleClearChat}
            disabled={clearingChat}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#8aa094] transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
            title="Clear chat"
            aria-label="Clear chat"
          >
            {clearingChat ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || loading}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f2c20] text-emerald-100 transition hover:bg-[#1e5c44] disabled:bg-[#e6ebe7] disabled:text-[#8aa094]"
          title="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
