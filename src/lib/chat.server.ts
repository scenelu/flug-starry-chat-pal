// Server-only chat handler: authenticates the pilot, enforces limits, calls Groq and saves messages.
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import {
  DEFAULT_TITLE,
  FLUG_SYSTEM_PROMPT,
  GROQ_ENDPOINT,
  GROQ_MODEL,
  LIMITS,
  checkRateLimit,
  titleFromMessage,
  validateMessage,
} from "./chat-limits";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string(),
});

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status });
}

function createSupabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function groqErrorMessage(status: number): string {
  if (status === 401 || status === 403)
    return "Flug's Groq key was rejected. Please check the GROQ_API_KEY secret.";
  if (status === 429) return "Groq's signal is overloaded right now (rate limit). Try again in a moment.";
  if (status >= 500) return "Groq's servers are having a cosmic hiccup. Try again shortly.";
  return "Flug couldn't reach Groq. Please try again.";
}

export async function handleChatRequest(request: Request): Promise<Response> {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const GROQ_API_KEY = process.env["GROQ_API_KEY"];
  if (!SUPABASE_URL || !SUPABASE_KEY) return json(500, { error: "Backend is not configured." });
  if (!GROQ_API_KEY) {
    return json(500, { error: "Flug's Groq key is missing. Add the GROQ_API_KEY secret." });
  }

  // --- Auth ---
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || token.split(".").length !== 3) return json(401, { error: "Please reload to reconnect." });

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_KEY), headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  const claims = claimsData?.claims;
  if (claimsError || !claims?.sub) return json(401, { error: "Session expired. Please reload." });
  const userId = claims.sub;
  const isGuest = Boolean((claims as { is_anonymous?: boolean }).is_anonymous);

  // --- Input ---
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return json(400, { error: "Invalid request." });
  }
  const valid = validateMessage(parsed.content);
  if (!valid.ok) return json(400, { error: valid.reason });
  const content = valid.value;

  // --- Ownership (RLS only returns the pilot's own conversations) ---
  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .select("id, title")
    .eq("id", parsed.conversationId)
    .maybeSingle();
  if (convoError) return json(500, { error: "Could not open this chat." });
  if (!convo) return json(404, { error: "Chat not found." });

  // --- Rate limiting ---
  const now = Date.now();
  const [minuteRes, dayRes] = await Promise.all([
    supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(now - 60_000).toISOString()),
    supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(now - 86_400_000).toISOString()),
  ]);
  if (minuteRes.error || dayRes.error) return json(500, { error: "Could not check usage." });
  const limit = checkRateLimit({ lastMinute: minuteRes.count ?? 0, lastDay: dayRes.count ?? 0 }, isGuest);
  if (!limit.ok) return json(429, { error: limit.reason });

  const { error: usageError } = await supabase.from("ai_usage").insert({ user_id: userId });
  if (usageError) return json(500, { error: "Could not record usage." });

  // --- Save the pilot's message ---
  const { data: userMsg, error: userMsgError } = await supabase
    .from("messages")
    .insert({ conversation_id: convo.id, user_id: userId, role: "user", content })
    .select("id")
    .single();
  if (userMsgError || !userMsg) return json(500, { error: "Could not save your message." });

  const titleUpdate = convo.title === DEFAULT_TITLE ? { title: titleFromMessage(content) } : {};
  await supabase.from("conversations").update({ ...titleUpdate, updated_at: new Date().toISOString() }).eq("id", convo.id);

  // --- Context ---
  const { data: history, error: historyError } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", convo.id)
    .order("seq", { ascending: false })
    .limit(LIMITS.historyMessages);
  if (historyError || !history) return json(500, { error: "Could not load chat history." });
  const contextMessages = history.reverse().map((m) => ({ role: m.role, content: m.content }));

  // --- Groq (the only AI provider) ---
  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        stream: true,
        temperature: 0.7,
        max_tokens: LIMITS.maxOutputTokens,
        messages: [{ role: "system", content: FLUG_SYSTEM_PROMPT }, ...contextMessages],
      }),
    });
  } catch (err) {
    console.error("Groq network error", err);
    await supabase.from("messages").delete().eq("id", userMsg.id);
    return json(502, { error: "Flug lost the signal to Groq. Check your connection and try again." });
  }

  if (!groqRes.ok || !groqRes.body) {
    const detail = await groqRes.text().catch(() => "");
    console.error("Groq error", groqRes.status, detail.slice(0, 500));
    await supabase.from("messages").delete().eq("id", userMsg.id);
    return json(502, { error: groqErrorMessage(groqRes.status) });
  }

  // --- Stream Groq SSE -> NDJSON events for the browser ---
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const groqBody = groqRes.body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      let full = "";
      let buffer = "";
      const reader = groqBody.getReader();
      try {
        send({ t: "start", userMessageId: userMsg.id });
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const chunk = JSON.parse(payload) as {
                choices?: { delta?: { content?: string } }[];
                error?: { message?: string };
              };
              if (chunk.error) throw new Error(chunk.error.message ?? "Groq stream error");
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                full += delta;
                send({ t: "delta", v: delta });
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
        if (!full.trim()) throw new Error("Empty reply from Groq");
        const { data: saved, error: saveError } = await supabase
          .from("messages")
          .insert({ conversation_id: convo.id, user_id: userId, role: "assistant", content: full })
          .select("id")
          .single();
        if (saveError) console.error("Failed to save assistant message", saveError);
        send({ t: "done", id: saved?.id ?? null });
      } catch (err) {
        console.error("Groq stream failed", err);
        if (full.trim()) {
          await supabase
            .from("messages")
            .insert({ conversation_id: convo.id, user_id: userId, role: "assistant", content: full });
        }
        send({ t: "error", message: "Flug's transmission from Groq was interrupted. Try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
