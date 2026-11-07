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

  // Clear Chat Option (removes current conversation and starts fresh)
  const handleClearChat = async () => {
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`space-y-4 w-full h-[calc(100vh-130px)] flex flex-col relative transition-colors ${
        isDraggingOver ? "ring-4 ring-emerald-400/50 rounded-2xl bg-emerald-50/20" : ""
      }`}
    >
      {/* Hidden file input for paper uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Drag & drop overlay indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-emerald-600/10 backdrop-blur-xs rounded-2xl z-50 flex items-center justify-center border-2 border-dashed border-emerald-500 pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-emerald-200 text-center space-y-1">
            <Upload className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-sm text-slate-900">Drop Research Paper Here</h4>
            <p className="text-xs text-slate-500">PDF, DOCX, or text manuscript for immediate analysis</p>
          </div>
        </div>
      )}

      {/* HERO HEADER BAR (Forest Emerald Theme) */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0a2318] via-[#0f2c20] to-[#164533] border border-emerald-500/30 text-white shadow-lg shadow-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-heading font-extrabold text-white leading-tight drop-shadow-xs">
                Ask NatureAide
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                AI Scientific Research Assistant
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              Grounded Medicinal Plant Literature · In-Silico Screening · Together AI Inference
            </p>
          </div>
        </div>

        {/* Project Selector & Actions (Includes Clear Chat Option) */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          {(messages.length > 0 || attachedPaper) && (
            <button
              type="button"
              onClick={handleClearChat}
              disabled={clearingChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:border-rose-400/40 border border-white/20 text-xs font-semibold text-emerald-100 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
              title="Clear current chat and start fresh"
            >
              {clearingChat ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
              )}
              <span>Clear Chat</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-200 font-semibold whitespace-nowrap">Dossier:</span>
            <div className="relative">
              <select
                value={selectedProjectId || ""}
                onChange={(e) => {
                  setSelectedProjectId(Number(e.target.value));
                  setMessages([]);
                  setConversationId(null);
                  setAttachedPaper(null);
                }}
                className="pl-3 pr-8 py-1.5 rounded-xl border border-white/20 bg-white/10 text-xs font-semibold text-white outline-none focus:bg-[#0f2c20] backdrop-blur-md cursor-pointer appearance-none max-w-[220px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900 bg-white">
                    {p.plantName} ({p.title})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-200 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK MANUSCRIPT ATTACHMENT STRIP IF DOSSIER HAS MANUSCRIPT */}
      {selectedProject?.hasManuscript && !attachedPaper && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-slate-700">
            <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              This project has an uploaded manuscript:{" "}
              <strong className="text-slate-900">{selectedProject.manuscriptFileName || "manuscript.pdf"}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleLoadProjectManuscript}
            disabled={loadingManuscript}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f2c20] hover:bg-[#164533] disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer shrink-0"
          >
            {loadingManuscript ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BookOpen className="w-3.5 h-3.5" />
            )}
            <span>Analyze Project Paper</span>
          </button>
        </div>
      )}

      {/* CHAT MESSAGES CONTAINER */}
      <div className="flex-1 bg-white border border-[#dde6df] rounded-2xl shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {/* Welcome Banner when Empty */}
        {messages.length === 0 && (
          <div className="p-6 rounded-2xl bg-[#faf9f5] border border-[#dde6df] text-center max-w-2xl mx-auto space-y-4 my-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                Grounded Scientific Research &amp; Paper Q&amp;A Assistant
              </h3>
              <p className="text-xs text-[#52665b] leading-relaxed max-w-lg mx-auto">
                {attachedPaper ? (
                  <>
                    Active Paper: <strong className="text-[#0f2c20]">{attachedPaper.fileName}</strong> (
                    {attachedPaper.pageCount} pages). Ask any question, request a summary, or inspect methodology,
                    phytochemicals, and docking scores just like ChatGPT.
                  </>
                ) : (
                  <>
                    Ask specific questions about your research dossier{" "}
                    <span className="font-bold text-[#0f2c20]">
                      {selectedProject?.plantName ? `(${selectedProject.plantName})` : ""}
                    </span>
                    , or <strong>upload any research paper</strong> (PDF / DOCX) to analyze it.
                  </>
                )}
              </p>
            </div>

            {/* Quick Upload Action inside Welcome Card */}
            {!attachedPaper && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                >
                  {uploadingFile ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  ) : (
                    <Upload className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>Upload Research Paper / Manuscript</span>
                </button>
              </div>
            )}

            {/* Suggested Questions Grid */}
            <div className="pt-2 text-left space-y-2">
              <p className="text-[11px] font-bold text-[#78997f] uppercase tracking-wider text-center">
                Suggested Research Queries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(attachedPaper ? PAPER_SUGGESTED_QUESTIONS : DOSSIER_SUGGESTED_QUESTIONS).map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-50/70 border border-[#dde6df] hover:border-emerald-300 text-left text-xs font-medium text-slate-700 hover:text-emerald-900 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <span className="truncate pr-2">{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#dde6df] text-[11px] text-[#52665b] flex items-center justify-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Evidence-grounded assistant. Predicted binding scores reflect in-silico models and do not replace laboratory assay verification.
              </span>
            </div>
          </div>
        )}

        {/* Message Feed */}
        {messages.map((msg) => {
          const isUser = msg.sender === "USER";
          const isCopied = copiedMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              } animate-in fade-in duration-150`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? "bg-[#0f2c20] text-emerald-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`relative group rounded-2xl p-4 text-xs transition-all ${
                  isUser
                    ? "bg-[#0f2c20] text-white shadow-xs rounded-tr-xs"
                    : "bg-[#f8faf8] border border-[#dde6df] text-slate-900 shadow-2xs rounded-tl-xs"
                }`}
              >
                {/* Paper attachment pill inside user message */}
                {isUser && msg.attachedPaper && (
                  <div className="mb-2 pb-2 border-b border-emerald-800/80 flex items-center gap-1.5 text-[11px] text-emerald-200">
                    <FileText className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="font-semibold truncate">
                      Attached: {msg.attachedPaper.fileName}
                      {msg.attachedPaper.pageCount ? ` (${msg.attachedPaper.pageCount} pages)` : ""}
                    </span>
                  </div>
                )}

                {/* Content */}
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <div>{renderMessageContent(msg.content)}</div>
                )}

                {/* Action Bar (Copy button on assistant messages) */}
                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">Together AI · Grounded Research</span>
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                      title="Copy response to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-xl mr-auto animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-xs bg-[#f8faf8] border border-[#dde6df] text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span className="font-semibold text-[#0f2c20]">
                  Analyzing research evidence &amp; literature...
                </span>
              </div>
              <p className="text-[11px] text-[#78997f]">
                Correlating botanical assays, docking scores, and safety monographs.
              </p>
            </div>
          </div>
        )}

        {/* Bottom clear chat button when there are messages */}
        {messages.length > 0 && !loading && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleClearChat}
              disabled={clearingChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Clear all messages in this conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear chat history</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ACTIVE ATTACHED PAPER STRIP */}
      {attachedPaper && (
        <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">
                Active Paper: {attachedPaper.fileName}
              </p>
              <p className="text-[10px] text-emerald-800">
                {attachedPaper.pageCount} page{attachedPaper.pageCount === 1 ? "" : "s"} · Ready for Q&amp;A
                (e.g., &ldquo;Summarize this paper&rdquo;)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachedPaper(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer shrink-0"
            title="Detach this paper"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* INPUT BOX & ATTACHMENT CONTROLS */}
      <div className="relative shrink-0 space-y-2">
        <div className="relative flex items-end gap-2 bg-white border border-[#dde6df] focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl p-2 shadow-xs transition-all">
          {/* File Upload Button (Paperclip) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer shrink-0"
            title="Upload research paper or manuscript (PDF, DOCX, TXT)"
          >
            {uploadingFile ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </button>

          {/* Text Input */}
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
                ? `Ask any question about "${attachedPaper.fileName}" (e.g., "Summarize this paper", "What are the limitations?")...`
                : selectedProject
                ? `Ask a question about ${selectedProject.plantName} or attach a research paper to analyze...`
                : "Ask NatureAide a research question or attach a paper to analyze..."
            }
            className="flex-1 max-h-36 min-h-[40px] py-2 px-1 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent resize-none outline-none leading-relaxed"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || loading}
            className="p-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#164533] disabled:bg-slate-200 text-white disabled:text-slate-400 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between px-2 text-[10px] text-[#78997f]">
          <span>
            Tip: You can drag &amp; drop PDF manuscripts directly into the chat or ask &ldquo;Please summarize this paper&rdquo;.
          </span>
          <span className="font-mono hidden sm:inline">NaturAide AI Lab v1.0</span>
        </div>
      </div>
    </div>
  );
}
