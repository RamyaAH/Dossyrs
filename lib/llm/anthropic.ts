// SERVER-ONLY. Thin wrapper over the Anthropic Messages API using plain
// fetch (no SDK dependency) — used to play WSE personas live in
// conversation. Never import this from a "use client" component; only
// scenario API routes should call it, so the API key never reaches the
// browser bundle.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export class LlmConfigError extends Error {}
export class LlmRequestError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

// Builds the request body as a pure function so prompt-construction logic
// can be unit-tested without a network call.
export function buildMessagesRequestBody(opts: {
  systemPrompt: string;
  messages: LlmMessage[];
  model?: string;
  maxTokens?: number;
}) {
  return {
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 500,
    system: opts.systemPrompt,
    messages: opts.messages,
  };
}

export async function callClaude(opts: {
  systemPrompt: string;
  messages: LlmMessage[];
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LlmConfigError(
      "ANTHROPIC_API_KEY is not set. Add a real key to .env.local (dev) and your deployment's environment variables (prod) — get one at https://console.anthropic.com."
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(buildMessagesRequestBody(opts)),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new LlmRequestError(`Anthropic API error ${response.status}: ${detail}`, response.status);
  }

  const data = (await response.json()) as {
    content: { type: string; text?: string }[];
  };

  const text = data.content.find((block) => block.type === "text")?.text;
  if (!text) {
    throw new LlmRequestError("Anthropic API returned no text content", 502);
  }
  return text;
}
