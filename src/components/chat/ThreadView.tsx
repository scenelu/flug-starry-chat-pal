import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  conversationsKey,
  messagesKey,
  takePendingMessage,
  useMessages,
  type ChatMessage,
} from "@/lib/conversations";
import { playBlip } from "@/lib/sound";
import { Flug } from "@/components/pixel/Flug";
import { Composer } from "./Composer";
import { useFlugMood } from "./FlugMoodContext";
import { FlugRow, PilotRow, ThinkingRow } from "./MessageRow";

type Status = "idle" | "submitted" | "streaming";

export function ThreadView({ threadId }: { threadId: string }) {
  const { session, ready } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const { setMood } = useFlugMood();
  const { data, isLoading, isError } = useMessages(threadId, ready && Boolean(session));
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingChecked = useRef(false);

  useEffect(() => {
    if (data && messages === null) setMessages(data);
  }, [data, messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Auto-scroll when new content arrives (only if the pilot is near the bottom).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
    if (nearBottom || status === "submitted") bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const send = useCallback(
    async (text: string) => {
      if (status !== "idle") return;
      const userTemp: ChatMessage = { id: `local-${Date.now()}`, role: "user", content: text };
      const flugTemp: ChatMessage = { id: `flug-${Date.now()}`, role: "assistant", content: "", status: "streaming" };
      setMessages((m) => [...(m ?? []), userTemp]);
      setDraft("");
      setStatus("submitted");
      setMood("thinking");
      playBlip("send");

      const fail = (message: string, keepUser: boolean) => {
        setMessages((m) => {
          const list = (m ?? []).filter((x) => x.id !== flugTemp.id && (keepUser || x.id !== userTemp.id));
          return [...list, { id: `err-${Date.now()}`, role: "assistant", content: message, status: "error" }];
        });
        if (!keepUser) setDraft(text);
        setStatus("idle");
        setMood("error");
        playBlip("error");
        setTimeout(() => setMood("idle"), 2500);
      };

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const { data: s } = await supabase.auth.getSession();
        const token = s.session?.access_token;
        if (!token) return fail("Flug lost your session. Please reload the page.", false);

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ conversationId: threadId, content: text }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          return fail(body?.error ?? "Flug couldn't reach Groq. Please try again.", false);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let started = false;
        let full = "";
        let finalId: string | null = null;
        let streamError: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const evt = JSON.parse(line) as
              | { t: "start" }
              | { t: "delta"; v: string }
              | { t: "done"; id: string | null }
              | { t: "error"; message: string };
            if (evt.t === "delta") {
              full += evt.v;
              if (!started) {
                started = true;
                setStatus("streaming");
                setMood("responding");
                setMessages((m) => [...(m ?? []), { ...flugTemp, content: full }]);
              } else {
                setMessages((m) => (m ?? []).map((x) => (x.id === flugTemp.id ? { ...x, content: full } : x)));
              }
            } else if (evt.t === "done") {
              finalId = evt.id;
            } else if (evt.t === "error") {
              streamError = evt.message;
            }
          }
        }

        if (streamError && !full) return fail(streamError, true);
        setMessages((m) => {
          const list = (m ?? []).map((x) =>
            x.id === flugTemp.id ? { id: finalId ?? x.id, role: "assistant" as const, content: full } : x,
          );
          if (streamError) list.push({ id: `err-${Date.now()}`, role: "assistant", content: streamError, status: "error" });
          return list;
        });
        setStatus("idle");
        playBlip("receive");
        setTimeout(() => setMood("idle"), 900);
        void queryClient.invalidateQueries({ queryKey: conversationsKey(userId) });
        void queryClient.invalidateQueries({ queryKey: messagesKey(threadId) });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        console.error(e);
        fail("Flug's signal got scrambled. Check your connection and try again.", false);
      }
    },
    [status, threadId, setMood, queryClient, userId],
  );

  // Send the message typed on the welcome screen.
  useEffect(() => {
    if (messages === null || pendingChecked.current) return;
    pendingChecked.current = true;
    const pending = takePendingMessage(threadId);
    if (pending && messages.length === 0) void send(pending);
  }, [messages, threadId, send]);

  useEffect(() => () => setMood("idle"), [setMood]);

  if (isError || (!isLoading && data === undefined && ready && session)) {
    return <NotFound />;
  }

  const lastFlugIndex = messages ? messages.map((m) => m.role).lastIndexOf("assistant") : -1;

  return (
    <>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 px-4 py-6 sm:px-6">
          {messages === null && (
            <p className="py-10 text-center font-display text-[9px] text-flug-mint">Receiving transmission…</p>
          )}
          {messages?.length === 0 && status === "idle" && (
            <div className="flex flex-col items-center py-12 text-center">
              <Flug size={84} />
              <p className="mt-4 text-lg text-flug-cream">Channel open. Say something to Flug!</p>
            </div>
          )}
          {messages?.map((m, i) =>
            m.role === "user" ? (
              <PilotRow key={m.id} message={m} />
            ) : (
              <FlugRow key={m.id} message={m} animate={i === lastFlugIndex} />
            ),
          )}
          {status === "submitted" && <ThinkingRow />}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-4xl px-4 pb-5 pt-2 sm:px-6">
        <Composer value={draft} onChange={setDraft} onSend={send} busy={status !== "idle" || messages === null} />
        <p className="mt-3 text-center font-display text-[7px] uppercase leading-relaxed text-muted-foreground">
          Flug runs on Groq · Enter to send · Shift+Enter for new line
        </p>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <Flug mood="error" size={96} />
      <p className="mt-5 font-display text-xs text-flug-sage">Chat not found</p>
      <p className="mt-3 text-flug-cream">This transmission drifted into a black hole.</p>
      <Link to="/" className="pixel-btn pixel-btn-primary mt-6">
        New chat
      </Link>
    </div>
  );
}
