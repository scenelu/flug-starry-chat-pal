import { describe, expect, it } from "vitest";
import { checkRateLimit, LIMITS, titleFromMessage, validateMessage, GROQ_MODEL } from "./chat-limits";

describe("chat rules", () => {
  it("uses the Groq llama-3.3-70b-versatile model", () => {
    expect(GROQ_MODEL).toBe("llama-3.3-70b-versatile");
  });

  it("blocks a guest after 8 messages in one minute", () => {
    expect(checkRateLimit({ lastMinute: 7, lastDay: 7 }, true).ok).toBe(true);
    expect(checkRateLimit({ lastMinute: 8, lastDay: 8 }, true).ok).toBe(false);
  });

  it("blocks a guest after 60 messages in a day", () => {
    expect(checkRateLimit({ lastMinute: 0, lastDay: 60 }, true).ok).toBe(false);
  });

  it("lets signed-in pilots send up to 15 per minute and 300 per day", () => {
    expect(checkRateLimit({ lastMinute: 14, lastDay: 299 }, false).ok).toBe(true);
    expect(checkRateLimit({ lastMinute: 15, lastDay: 0 }, false).ok).toBe(false);
    expect(checkRateLimit({ lastMinute: 0, lastDay: 300 }, false).ok).toBe(false);
  });

  it("rejects empty and over-long messages", () => {
    expect(validateMessage("   ").ok).toBe(false);
    expect(validateMessage("x".repeat(LIMITS.maxMessageChars + 1)).ok).toBe(false);
    expect(validateMessage("  hi Flug ")).toEqual({ ok: true, value: "hi Flug" });
  });

  it("titles a chat from its first message, max 40 characters", () => {
    expect(titleFromMessage("Tell me a space fact")).toBe("Tell me a space fact");
    expect(titleFromMessage("a".repeat(80)).length).toBe(40);
  });
});
