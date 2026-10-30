/**
 * Server-only xAI Grok provider for NatureAide.
 *
 * Grok serves strictly as the language and reasoning layer.
 * All botanical, pharmacological, and clinical knowledge is retrieved
 * from the verified NatureAide MySQL knowledge base and passed as grounding context.
 *
 * Security & Governance:
 * - Server-side only (never exposes XAI_API_KEY to browser, logs, or error responses)
 * - Configurable via XAI_API_KEY, XAI_BASE_URL, and XAI_MODEL
 * - Request data retention disabled (store: false) where supported
 * - Resilient timeout and error handling without user-facing technical details
 */

export interface ChatMessageParam {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GrokResponse {
  success: boolean;
  content?: string;
  model: string;
  error?: string;
}

export interface GrokDiagnostics {
  provider: "GROK";
  model: string;
  configured: boolean;
  fallbackAvailable: boolean;
}

export function isGrokConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY && process.env.XAI_API_KEY.trim().length > 0);
}

export function getGrokDiagnostics(): GrokDiagnostics {
  const model = process.env.XAI_MODEL || "grok-4.7";
  return {
    provider: "GROK",
    model,
    configured: isGrokConfigured(),
    fallbackAvailable: true,
  };
}

export async function callGrokChat(
  messages: ChatMessageParam[],
  options?: { timeoutMs?: number; temperature?: number; maxTokens?: number }
): Promise<GrokResponse> {
  const apiKey = process.env.XAI_API_KEY;
  const baseUrl = (process.env.XAI_BASE_URL || "https://api.x.ai/v1").replace(/\/+$/, "");
  const model = process.env.XAI_MODEL || "grok-4.7";
  const timeoutMs = options?.timeoutMs ?? 15000;

  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      model,
      error: "XAI_API_KEY_NOT_CONFIGURED",
    };
  }

  const endpoint = `${baseUrl}/chat/completions`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const payload: Record<string, any> = {
      model,
      messages,
      temperature: options?.temperature ?? 0.1, // High precision grounding
      max_tokens: options?.maxTokens ?? 400,
      store: false, // Privacy: disable provider-side storage where supported
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
        "User-Agent": "NatureAide-Grok-Service/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let statusDesc = `HTTP_${response.status}`;
      try {
        const errJson = await response.json();
        // If store parameter is rejected by an endpoint version, retry without it
        if (response.status === 400 && JSON.stringify(errJson).includes("store")) {
          delete payload.store;
          const retryController = new AbortController();
          const retryTimer = setTimeout(() => retryController.abort(), timeoutMs);
          const retryRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey.trim()}`,
              "User-Agent": "NatureAide-Grok-Service/1.0",
            },
            body: JSON.stringify(payload),
            signal: retryController.signal,
          });
          clearTimeout(retryTimer);
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const text = (retryData?.choices?.[0]?.message?.content || "").trim();
            if (text) {
              return { success: true, content: text, model };
            }
          }
        }
      } catch {
        // Ignore parse error on non-json error responses
      }
      return {
        success: false,
        model,
        error: statusDesc,
      };
    }

    const data = await response.json();
    const text = (data?.choices?.[0]?.message?.content || "").trim();

    if (!text) {
      return {
        success: false,
        model,
        error: "EMPTY_COMPLETION_RESPONSE",
      };
    }

    return {
      success: true,
      content: text,
      model,
    };
  } catch (error: any) {
    const isTimeout = error?.name === "AbortError";
    return {
      success: false,
      model,
      error: isTimeout ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
    };
  }
}
