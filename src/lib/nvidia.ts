// ============================================================
// RemindMe — NVIDIA NIM API Client
// OpenAI-compatible interface via meta/llama-3.3-70b-instruct
// ============================================================

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const MODEL = 'meta/llama-3.1-8b-instruct';

export interface NvidiaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NvidiaOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

/**
 * Call NVIDIA NIM chat completion API.
 * Server-side only (uses NVIDIA_API_KEY from env).
 */
export async function nvidiaChat(
  messages: NvidiaMessage[],
  options: NvidiaOptions = {},
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY is not set in environment variables.');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: options.temperature ?? 0.3,
        top_p: options.top_p ?? 0.7,
        max_tokens: options.max_tokens ?? 512,
        stream: false,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NVIDIA API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Parse JSON from AI response safely.
 * Strips markdown code fences if present.
 */
export function parseJsonFromAI<T>(raw: string): T {
  // Strip ```json ... ``` or ``` ... ``` fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
