import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { Spaceship } from "@/components/pixel/Spaceship";
import { LIMITS } from "@/lib/chat-limits";

export function Composer({
  onSend,
  busy,
  value,
  onChange,
  placeholder = "Transmit a message to Flug…",
  autoFocus = true,
}: {
  onSend: (text: string) => void;
  busy: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [launches, setLaunches] = useState<number[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  useEffect(() => {
    if (autoFocus && !busy) ref.current?.focus();
  }, [busy, autoFocus]);

  const tooLong = value.length > LIMITS.maxMessageChars;
  const canSend = !busy && value.trim().length > 0 && !tooLong;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    const id = Date.now();
    setLaunches((l) => [...l, id]);
    setTimeout(() => setLaunches((l) => l.filter((x) => x !== id)), 800);
    onSend(value.trim());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={submit} className="relative flex items-end gap-3">
      <div className="pixel-frame frame-sage flex-1 bg-flug-cream">
        <label htmlFor="flug-composer" className="sr-only">
          Message Flug
        </label>
        <textarea
          id="flug-composer"
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="pixel-input block max-h-[200px] w-full resize-none px-4 py-3 text-[1.1rem] leading-snug"
        />
        {value.length > LIMITS.maxMessageChars * 0.8 && (
          <div className={`px-4 pb-1 text-right font-display text-[8px] ${tooLong ? "text-flug-purple" : "text-flug-dusk"}`}>
            {value.length}/{LIMITS.maxMessageChars}
          </div>
        )}
      </div>
      <div className="relative">
        {launches.map((id) => (
          <span key={id} className="anim-ship-launch pointer-events-none absolute -top-6 left-2 z-20">
            <Spaceship size={28} />
          </span>
        ))}
        <button type="submit" disabled={!canSend} className="pixel-btn pixel-btn-primary h-[52px] px-4" aria-label="Send message">
          <PixelIcon name="send" size={14} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </form>
  );
}
