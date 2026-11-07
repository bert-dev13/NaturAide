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
  Paperclip,
  Upload,
  X,
  Copy,
  Check,
  Trash2,
  FileCheck2,
  RefreshCw,
  BookOpen,
} from "lucide-react";

interface ProjectOption {
  id: number;
  title: string;
  plantName: string;
  versionTag: string;
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
  "What are the major limitations?",
  "Explain the docking methodology.",
  "Which safety conclusions have weak evidence?",
  "Summarize the researcher's final conclusion.",
  "What should I pay attention to in the Bioinformatics review?",
];

const PAPER_SUGGESTED_QUESTIONS = [
  "Summarize this research paper.",
  "Explain the methodology and experimental design.",
  "What are the primary findings and results?",
  "What limitations or safety concerns are identified?",
  "Summarize the author's final conclusion.",
  "Analyze the bioactive phytochemicals discussed.",
];

export default function ReviewerAssistantPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        setUploadError(data.message || "No readable manuscript found for this dossier.");
      }
    } catch (err: any) {
      console.error("Project manuscript load error:", err);
      setUploadError(err?.message || "Failed to retrieve project manuscript.");
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading || uploadingFile) return;

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
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
          attachedPaper: attachedPaper
            ? {
                fileName: attachedPaper.fileName,
                fileType: attachedPaper.fileType,
                text: attachedPaper.fullText,
                pageCount: attachedPaper.pageCount,
              }
            : undefined,
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

  const handleCopyMessage = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const [clearingChat, setClearingChat] = useState(false);

  const handleClearChat = async () => {
    setClearingChat(true);
    try {
      if (conversationId) {
        await fetch(`/api/reviewer/assistant/chat?conversationId=${conversationId}`, {
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
    const tokens = text.split(
      /(\*\*.*?\*\*|`.*?`|\[LITERATURE\]|\[PREDICTED\]|\[FORMULATION\]|\[INTERPRETATION\]|\[EXPERIMENTAL\])/g
    );

    return tokens.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return (
          <strong key={i} className="font-extrabold text-slate-900">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded-md bg-slate-200/80 text-blue-900 font-mono text-[11px] font-bold"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token === "[LITERATURE]") {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-100 text-blue-800"
          >
            [LIT]
          </span>
        );
      }
      if (token === "[PREDICTED]") {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-teal-100 text-teal-800"
          >
            [IN-SILICO]
          </span>
        );
      }
      return token;
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
              <h5 key={pIdx} className="font-bold text-xs uppercase tracking-wider text-blue-950 pt-1">
                {trimmed.replace(/^####\s+/, "")}
              </h5>
            );
          }

          // Heading 3
          if (trimmed.startsWith("### ")) {
            return (
              <h4 key={pIdx} className="font-bold text-sm text-blue-950 pt-1 border-b border-slate-200/60 pb-1">
                {trimmed.replace(/^###\s+/, "")}
              </h4>
            );
          }

          // Blockquote
          if (trimmed.startsWith("> ")) {
            return (
              <blockquote
                key={pIdx}
                className="pl-3 border-l-2 border-blue-400 bg-blue-50/50 p-2 rounded-r-lg text-slate-700 italic text-[11.5px]"
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
        isDraggingOver ? "ring-4 ring-blue-400/50 rounded-2xl bg-blue-50/20" : ""
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
        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-xs rounded-2xl z-50 flex items-center justify-center border-2 border-dashed border-blue-500 pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-blue-200 text-center space-y-1">
            <Upload className="w-8 h-8 text-blue-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-sm text-slate-900">Drop Research Paper Here</h4>
            <p className="text-xs text-slate-500">PDF, DOCX, or text manuscript for immediate analysis</p>
          </div>
        </div>
      )}

      {/* HERO HEADER BAR */}
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
                AI Peer Review &amp; Paper Q&amp;A
              </span>
            </div>
            <p className="text-[11px] text-blue-200/80">
              Professional Scientific Review Assistant · Together AI Grounding
            </p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          {(messages.length > 0 || attachedPaper) && (
            <button
              type="button"
              onClick={handleClearChat}
              disabled={clearingChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:border-rose-400/40 border border-white/20 text-xs font-semibold text-blue-100 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
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
            <span className="text-xs text-blue-200 font-semibold whitespace-nowrap">Dossier:</span>
            <select
              value={selectedProjectId || ""}
              onChange={(e) => {
                setSelectedProjectId(Number(e.target.value));
                setMessages([]);
                setConversationId(null);
                setAttachedPaper(null);
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
      </div>

      {/* QUICK MANUSCRIPT ATTACHMENT STRIP IF DOSSIER HAS MANUSCRIPT */}
      {selectedProject?.hasManuscript && !attachedPaper && (
        <div className="px-4 py-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-slate-700">
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              This dossier has an uploaded manuscript:{" "}
              <strong className="text-slate-900">{selectedProject.manuscriptFileName || "manuscript.pdf"}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleLoadProjectManuscript}
            disabled={loadingManuscript}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold transition-colors cursor-pointer shrink-0"
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
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {/* Welcome Banner */}
        {messages.length === 0 && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center max-w-2xl mx-auto space-y-4 my-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-sm text-slate-900">
                Grounded Peer Review &amp; Paper Q&amp;A Assistant
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
                {attachedPaper ? (
                  <>
                    Active Paper: <strong className="text-slate-900">{attachedPaper.fileName}</strong> (
                    {attachedPaper.pageCount} pages). Ask any question, request a summary, or inspect methodology,
                    limitations, and results just like ChatGPT.
                  </>
                ) : (
                  <>
                    Ask specific questions about the dossier{" "}
                    <span className="font-bold text-slate-800">
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  {uploadingFile ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <Paperclip className="w-4 h-4 text-blue-600" />
                  )}
                  <span>Upload Paper / Manuscript (PDF, DOCX)</span>
                </button>

                {selectedProject?.hasManuscript && (
                  <button
                    type="button"
                    onClick={handleLoadProjectManuscript}
                    disabled={loadingManuscript}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {loadingManuscript ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCheck2 className="w-4 h-4" />
                    )}
                    <span>Load Dossier Paper</span>
                  </button>
                )}
              </div>
            )}

            {/* Suggested Prompts */}
            <div className="pt-2 space-y-1.5 text-left">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {attachedPaper ? "Suggested Paper Queries:" : "Suggested Review Queries:"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(attachedPaper ? PAPER_SUGGESTED_QUESTIONS : DOSSIER_SUGGESTED_QUESTIONS).map((q, i) => (
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
              Note: AI assists in evidence inspection only. Professional approval decisions must always be made by
              credentialed reviewers.
            </p>
          </div>
        )}

        {/* Active conversation control bar */}
        {messages.length > 0 && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 text-xs">
            <span className="font-semibold text-slate-500">
              {messages.length} {messages.length === 1 ? "message" : "messages"} in conversation
            </span>
            <button
              type="button"
              onClick={handleClearChat}
              disabled={clearingChat}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-600 font-medium transition-colors cursor-pointer text-xs"
              title="Clear all messages in this conversation"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear chat history</span>
            </button>
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
                  isUser ? "bg-blue-600 text-white" : "bg-slate-100 border border-slate-200 text-blue-600"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-3xl sm:max-w-4xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 shadow-2xs relative group ${
                  isUser
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
                }`}
              >
                {/* User attached paper chip */}
                {isUser && m.attachedPaper && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-700/80 border border-blue-400/40 text-[11px] font-medium text-blue-100 mb-1">
                    <Paperclip className="w-3 h-3 text-blue-200" />
                    <span>Attached: {m.attachedPaper.fileName}</span>
                  </div>
                )}

                {/* Message Body */}
                {isUser ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  renderMessageContent(m.content)
                )}

                {/* Footer with timestamp and copy button */}
                <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-200/40 text-[10px]">
                  <span className={isUser ? "text-blue-200" : "text-slate-400 font-mono"}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>

                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(m.id, m.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedMessageId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 rounded-tl-none flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>
                {attachedPaper
                  ? `Analyzing "${attachedPaper.fileName}" with Together AI...`
                  : "Analyzing research dossier with Together AI..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ERROR NOTICE IF ANY */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-600 hover:text-rose-900 font-bold p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ACTIVE ATTACHED PAPER CARD (IF ATTACHED) */}
      {attachedPaper && (
        <div className="p-3 bg-blue-50/90 border border-blue-200/90 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {attachedPaper.fileName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  ✓ Ready for Q&amp;A
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{attachedPaper.fileType.toUpperCase()}</span>
                <span>•</span>
                <span>{attachedPaper.pageCount} Pages</span>
                {attachedPaper.fileSize && (
                  <>
                    <span>•</span>
                    <span>{(attachedPaper.fileSize / 1024).toFixed(1)} KB</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSendMessage("Please provide an executive summary of this paper.")}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              Summarize Paper
            </button>
            <button
              type="button"
              onClick={() => setAttachedPaper(null)}
              className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Remove attached paper"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* INPUT FORM (With Attachment Action & ChatGPT-like Feel) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-2.5 sm:p-3 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-2 shrink-0"
      >
        {/* Upload Paper Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || loading}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200/80 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          title="Upload Research Paper (PDF, DOCX, TXT, MD)"
        >
          {uploadingFile ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Attach Paper</span>
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            attachedPaper
              ? `Ask anything about "${attachedPaper.fileName}" (e.g., "Summarize this paper", "What are the limitations?")...`
              : "Ask a question about the research dossier, or attach a paper to analyze..."
          }
          className="flex-1 px-3 py-2 text-xs text-slate-800 outline-none bg-slate-50 focus:bg-white rounded-xl border border-slate-200 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || loading || uploadingFile}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
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
