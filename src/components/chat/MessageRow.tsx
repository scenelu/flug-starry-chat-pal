import { useState } from "react";
import { Flug, type FlugMood } from "@/components/pixel/Flug";
import { Spaceship } from "@/components/pixel/Spaceship";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { ChatMessage } from "@/lib/conversations";
import { Markdown } from "./Markdown";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="pixel-chip"
      aria-label="Copy message"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
    >
      <PixelIcon name={copied ? "check" : "copy"} size={10} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AvatarTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="avatar-tile pixel-frame-flat mt-1 flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
      {children}
    </div>
  );
}

export function FlugRow({ message, animate }: { message: ChatMessage; animate: boolean }) {
  const mood: FlugMood =
    message.status === "error" ? "error" : message.status === "streaming" ? "responding" : "idle";
  return (
    <div className="anim-pop flex items-start gap-4 sm:gap-5">
      <AvatarTile>
        <Flug mood={mood} size={36} animated={animate} />
      </AvatarTile>
      <div className="bubble-flug pixel-frame bubble-tail-left min-w-0 max-w-[min(46rem,100%)] flex-1 px-4 py-3 sm:flex-initial">
        <div className="mb-1.5 flex items-center justify-between gap-4">
          <span className="font-display text-[9px] uppercase tracking-wider">Flug</span>
          {message.status !== "streaming" && message.content && <CopyButton text={message.content} />}
        </div>
        {message.status === "error" ? (
          <p className="text-[1.05rem] leading-relaxed">{message.content}</p>
        ) : (
          <>
            <Markdown content={message.content} />
            {message.status === "streaming" && (
              <span className="anim-caret ml-0.5 inline-block h-4 w-2.5 translate-y-0.5 bg-flug-purple" aria-hidden />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function PilotRow({ message }: { message: ChatMessage }) {
  return (
    <div className="anim-pop flex flex-row-reverse items-start gap-4 sm:gap-5">
      <AvatarTile>
        <Spaceship size={32} flame={false} />
      </AvatarTile>
      <div className="bubble-pilot pixel-frame bubble-tail-right min-w-0 max-w-[min(36rem,85%)] px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between gap-4">
          <CopyButton text={message.content} />
          <span className="font-display text-[9px] uppercase tracking-wider">Pilot</span>
        </div>
        <p className="whitespace-pre-wrap text-[1.075rem] leading-relaxed [overflow-wrap:anywhere]">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export function ThinkingRow() {
  return (
    <div className="anim-pop flex items-start gap-4 sm:gap-5" role="status" aria-label="Flug is thinking">
      <AvatarTile>
        <Flug mood="thinking" size={36} />
      </AvatarTile>
      <div className="bubble-flug pixel-frame bubble-tail-left px-5 py-4">
        <div className="flex items-end gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="anim-dot block h-2.5 w-2.5 bg-flug-purple"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
