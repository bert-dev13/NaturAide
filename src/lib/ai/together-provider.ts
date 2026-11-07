/**
 * Server-only Together AI provider.
 * Uses the same TOGETHER_API_KEY and model chain configured for Ask NatureAide.
 * The key stays on the server and is never returned to the browser.
 */

let envChecked = false;
function ensureTogetherEnvLoaded() {
  if (envChecked || process.env.TOGETHER_API_KEY) {
    envChecked = true;
    return;
  }
  envChecked = true;
  try {
    if (typeof process !== "undefined" && typeof (process as any).loadEnvFile === "function") {
      (process as any).loadEnvFile(".env.local");
    }
  } catch {
    // ignore env read errors
  }
}

export interface TogetherMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface TogetherResponse {
  success: boolean;
  content?: string;
  model: string;
  error?: string;
}

function textFromUnknown(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";
  return value
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object") {
        const record = part as { text?: unknown; content?: unknown };
        return String(record.text || record.content || "");
      }
      return "";
    })
    .join("")
    .trim();
}

function cleanOutput(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, "").trim();

  // If text starts with internal reasoning phrases, discard reasoning tokens up to the double newline
  const thoughtPrefixes = [
    "we need",
    "need ",
    "thinking process:",
    "thought:",
    "thinking:",
    "let me think",
    "let's think",
  ];

  const lower = cleaned.toLowerCase();
  const startsWithThought = thoughtPrefixes.some((p) => lower.startsWith(p));

  if (startsWithThought) {
    const doubleBreak = cleaned.indexOf("\n\n");
    if (doubleBreak !== -1) {
      cleaned = cleaned.slice(doubleBreak + 2).trim();
    } else {
      // Entire output is an unparsed internal monologue without actual final content
      return "";
    }
  }

  // Secondary guard: If the result still starts with a thought phrase or ends with a hesitant monologue
  const stillThought =
    /^(need\s+|we\s+need\s+|thought:\s*|thinking:\s*|hmm\b)/i.test(cleaned) ||
    /(\bhmm\b|\bwait\b|\bmaybe\s+"[^"]+"\s+maybe\b)/i.test(cleaned.slice(0, 80));

  if (stillThought) {
    const nextBreak = cleaned.indexOf("\n\n");
    if (nextBreak !== -1) {
      cleaned = cleaned.slice(nextBreak + 2).trim();
    } else {
      return "";
    }
  }

  return cleaned.trim();
}

function readCompletion(data: {
  choices?: { message?: { content?: unknown; reasoning?: unknown; reasoning_content?: unknown }; text?: unknown }[];
}) {
  const message = data?.choices?.[0]?.message;
  const rawContent = textFromUnknown(message?.content);
  if (rawContent) {
    const cleaned = cleanOutput(rawContent);
    if (cleaned) return cleaned;
  }
  const candidates = [
    textFromUnknown(message?.reasoning),
    textFromUnknown(message?.reasoning_content),
    textFromUnknown(data?.choices?.[0]?.text),
  ].filter(Boolean);
  return candidates.find((text) => text.includes("{") && text.includes("}")) || cleanOutput(candidates[0] || "") || "";
}

function togetherModels() {
  ensureTogetherEnvLoaded();
  return [
    process.env.TOGETHER_MODEL_PRIMARY,
    process.env.TOGETHER_MODEL_FALLBACK,
    process.env.TOGETHER_MODEL_FINAL,
  ]
    .map((model) => (model || "").trim())
    .filter(Boolean);
}

export function isTogetherConfigured() {
  ensureTogetherEnvLoaded();
  return Boolean(process.env.TOGETHER_API_KEY?.trim()) && togetherModels().length > 0;
}

async function completeWithModel(
  model: string,
  messages: TogetherMessage[],
  options: { timeoutMs: number; temperature: number; maxTokens: number; json: boolean }
): Promise<TogetherResponse> {
  const apiKey = process.env.TOGETHER_API_KEY?.trim() || "";
  const endpoint = "https://api.together.xyz/v1/chat/completions";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  };
  if (options.json) payload.response_format = { type: "json_object" };

  try {
    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok && options.json && response.status === 400) {
      delete payload.response_format;
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        const message = body?.error?.message || body?.error || body?.message || "";
        detail = String(message).replace(/\s+/g, " ").trim().slice(0, 180);
      } catch {
        detail = "";
      }
      return { success: false, model, error: detail ? `HTTP_${response.status}: ${detail}` : `HTTP_${response.status}` };
    }

    const data = await response.json();
    const text = readCompletion(data);
    if (!text && options.json) {
      delete payload.response_format;
      const retry = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (retry.ok) {
        const retried = readCompletion(await retry.json());
        if (retried) return { success: true, content: retried, model };
      }
    }
    if (!text) {
      const finish = String(data?.choices?.[0]?.finish_reason || "unknown");
      return { success: false, model, error: `EMPTY_COMPLETION_RESPONSE:${finish}` };
    }
    return { success: true, content: text, model };
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : "";
    return { success: false, model, error: name === "AbortError" ? "REQUEST_TIMEOUT" : "NETWORK_ERROR" };
  } finally {
    clearTimeout(timer);
  }
}

export async function callTogetherChat(
  messages: TogetherMessage[],
  options?: { timeoutMs?: number; temperature?: number; maxTokens?: number; json?: boolean }
): Promise<TogetherResponse> {
  const models = togetherModels();
  const fallbackModel = models[0] || "unconfigured";
  if (!process.env.TOGETHER_API_KEY?.trim() || models.length === 0) {
    return { success: false, model: fallbackModel, error: "TOGETHER_NOT_CONFIGURED" };
  }

  const settings = {
    timeoutMs: options?.timeoutMs ?? 45000,
    temperature: options?.temperature ?? 0.2,
    maxTokens: options?.maxTokens ?? 700,
    json: options?.json ?? false,
  };

  let lastError = "REQUEST_FAILED";
  let lastModel = fallbackModel;
  for (const model of models) {
    const result = await completeWithModel(model, messages, settings);
    if (result.success && result.content) return result;
    lastError = result.error || lastError;
    lastModel = model;
  }

  return { success: false, model: lastModel, error: lastError };
}
