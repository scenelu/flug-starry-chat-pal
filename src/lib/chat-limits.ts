// Shared chat rules: used by the server (enforcement) and the browser (friendly hints).

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const FLUG_SYSTEM_PROMPT = `You are Flug, a friendly alien AI assistant from outer space. You are curious, clever, funny, and genuinely helpful.

Your personality is playful and slightly quirky, but you always prioritize giving accurate and useful answers.

You can occasionally make lighthearted space references, but never overdo them.

Explain difficult topics clearly, help users learn, and answer questions naturally.

You are an intelligent assistant, not just a character. You can help with programming, studying, creative writing, everyday questions, and general problem-solving.

Maintain conversation context and be transparent when you are uncertain.`;

export const LIMITS = {
  maxMessageChars: 4000,
  /** How many previous messages are sent to Groq as context. */
  historyMessages: 20,
  maxOutputTokens: 1024,
  guest: { perMinute: 8, perDay: 60 },
  member: { perMinute: 15, perDay: 300 },
} as const;

export type LimitResult = { ok: true } | { ok: false; reason: string };

export function checkRateLimit(
  counts: { lastMinute: number; lastDay: number },
  isGuest: boolean,
): LimitResult {
  const tier = isGuest ? LIMITS.guest : LIMITS.member;
  if (counts.lastMinute >= tier.perMinute) {
    return {
      ok: false,
      reason: "Whoa, pilot! Too many transmissions in a minute. Give Flug a moment to cool the antennas.",
    };
  }
  if (counts.lastDay >= tier.perDay) {
    return {
      ok: false,
      reason: isGuest
        ? "Daily guest fuel is used up. Sign in to keep chatting today, or come back tomorrow."
        : "Daily fuel is used up. Flug will be ready again tomorrow.",
    };
  }
  return { ok: true };
}

export function validateMessage(content: unknown): { ok: true; value: string } | { ok: false; reason: string } {
  if (typeof content !== "string") return { ok: false, reason: "Message must be text." };
  const value = content.trim();
  if (!value) return { ok: false, reason: "Message is empty." };
  if (value.length > LIMITS.maxMessageChars) {
    return { ok: false, reason: `Message is too long (max ${LIMITS.maxMessageChars} characters).` };
  }
  return { ok: true, value };
}

export const DEFAULT_TITLE = "New transmission";

export function titleFromMessage(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= 40) return oneLine || DEFAULT_TITLE;
  return oneLine.slice(0, 39).trimEnd() + "…";
}
