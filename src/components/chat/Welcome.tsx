import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Flug } from "@/components/pixel/Flug";
import { useAuth } from "@/lib/auth-context";
import { createConversation, setPendingMessage } from "@/lib/conversations";
import { playBlip } from "@/lib/sound";
import { Composer } from "./Composer";

const SUGGESTIONS = [
  "Tell me a space fact",
  "Help me with homework",
  "Let's write some code",
  "Surprise me, Flug!",
];

export function Welcome() {
  const { ready, session, error } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);

  const start = async (text: string) => {
    if (!session || starting) return;
    setStarting(true);
    playBlip("send");
    try {
      const id = await createConversation();
      setPendingMessage(id, text);
      await navigate({ to: "/c/$threadId", params: { threadId: id } });
    } catch (e) {
      console.error(e);
      toast.error("Flug couldn't open a new channel. Try again.");
      setStarting(false);
    }
  };

  const busy = !ready || !session || starting;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <div className="relative mb-8">
          <div className="anim-drift">
            <Flug mood={starting ? "thinking" : "idle"} size={150} />
          </div>
          <div className="mx-auto mt-2 h-2 w-24 bg-flug-night/60" aria-hidden />
        </div>
        <h2 className="pixel-title text-xl leading-relaxed text-flug-sage sm:text-3xl">HELLO, EARTHLING!</h2>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-flug-cream sm:text-xl">
          I'm Flug, your friendly alien assistant. What shall we explore today?
        </p>
        {error && <p className="mt-4 text-flug-sage">{error}</p>}

        <div className="mt-9 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => start(s)}
              className="pixel-btn pixel-btn-soft justify-start py-4 text-left text-[9px] leading-relaxed"
            >
              <span className="text-flug-dusk">▶</span> {s}
            </button>
          ))}
        </div>
      </div>
      <div className="sticky bottom-0 mx-auto w-full max-w-3xl px-4 pb-5 pt-2">
        <Composer value={draft} onChange={setDraft} onSend={start} busy={busy} />
        <p className="mt-3 text-center font-display text-[7px] uppercase leading-relaxed text-muted-foreground">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
