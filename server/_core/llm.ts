/**
 * LLM helper for yfit-admin.
 * Uses Manus Forge API for AI analysis in weekly analytics reports.
 */

import { ENV } from "../env.js";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface InvokeParams {
  messages: Message[];
  maxTokens?: number;
}

export interface InvokeResult {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = ENV.forgeApiKey;
  const apiUrl = ENV.forgeApiUrl
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

  if (!apiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: params.messages,
      max_tokens: params.maxTokens ?? 32768,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  return (await response.json()) as InvokeResult;
}
