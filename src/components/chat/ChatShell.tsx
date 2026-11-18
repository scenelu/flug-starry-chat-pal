import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flug, type FlugMood } from "@/components/pixel/Flug";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { Starfield } from "@/components/pixel/Starfield";
import { useAuth } from "@/lib/auth-context";
import { conversationsKey, deleteConversation, useConversations } from "@/lib/conversations";
import { playBlip, useSoundToggle } from "@/lib/sound";
import { FlugMoodContext } from "./FlugMoodContext";

// Remember the sidebar choice across page switches within the session.
let sidebarPref: boolean | null = null;

export function ChatShell({ activeId, children }: { activeId?: string; children: ReactNode }) {
  const [mood, setMood] = useState<FlugMood>("idle");
  const [open, setOpen] = useState(true);
  const { on: soundOn, toggle: toggleSound } = useSoundToggle();

  useEffect(() => {
    if (sidebarPref !== null) setOpen(sidebarPref);
    else if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  }, []);

  const setSidebar = (v: boolean) => {
    sidebarPref = v;
    setOpen(v);
    playBlip("click");
  };

  const closeOnMobile = () => {
    if (window.matchMedia("(max-width: 767px)").matches) setSidebar(false);
  };

  return (
    <FlugMoodContext.Provider value={{ mood, setMood }}>
      <div className="flex h-dvh overflow-hidden bg-flug-night">
        {/* Mobile backdrop */}
        {open && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-30 bg-flug-night/70 md:hidden"
            onClick={() => setSidebar(false)}
          />
        )}
        <Sidebar open={open} activeId={activeId} onNavigate={closeOnMobile} onClose={() => setSidebar(false)} />

        <main className="relative flex min-w-0 flex-1 flex-col bg-flug-purple">
          <header className="relative z-10 flex items-center gap-3 border-b-4 border-flug-night bg-flug-purple px-3 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => setSidebar(!open)}
              className="pixel-btn pixel-btn-dark pixel-btn-icon"
              aria-label={open ? "Hide sidebar" : "Show sidebar"}
              aria-expanded={open}
            >
              <PixelIcon name="menu" size={14} />
            </button>
            <Link to="/" className="flex items-center gap-3" aria-label="FLUG AI home">
              <span className="avatar-tile pixel-frame-flat frame-sage flex h-10 w-10 items-center justify-center">
                <Flug mood={mood} size={28} />
              </span>
              <h1 className="pixel-title text-sm text-flug-sage sm:text-base">
                FLUG <span className="text-flug-cream">AI</span>
              </h1>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                className="pixel-btn pixel-btn-dark pixel-btn-icon"
                aria-label={soundOn ? "Mute sound effects" : "Turn on sound effects"}
                aria-pressed={soundOn}
                title={soundOn ? "Sound on" : "Sound off"}
              >
                <PixelIcon name={soundOn ? "soundOn" : "soundOff"} size={16} />
              </button>
            </div>
          </header>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <Starfield />
            <div className="scanlines absolute inset-0" aria-hidden />
            <div className="relative z-[1] flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        </main>
      </div>
    </FlugMoodContext.Provider>
  );
}

function Sidebar({
  open,
  activeId,
  onNavigate,
  onClose,
}: {
  open: boolean;
  activeId?: string;
  onNavigate: () => void;
  onClose: () => void;
}) {
  const { session, isGuest, signOut } = useAuth();
  const userId = session?.user.id;
  const { data: conversations, isLoading, isError } = useConversations(userId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const onDelete = async (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((c) => (c === id ? null : c)), 3000);
      return;
    }
    setConfirmId(null);
    try {
      await deleteConversation(id);
      playBlip("click");
      await queryClient.invalidateQueries({ queryKey: conversationsKey(userId) });
      if (id === activeId) navigate({ to: "/" });
    } catch {
      toast.error("Couldn't delete that chat. Try again.");
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r-4 border-flug-purple bg-flug-night transition-transform duration-150 md:static md:z-auto ${
        open ? "translate-x-0" : "-translate-x-full md:hidden"
      }`}
      aria-label="Saved conversations"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="font-display text-[9px] uppercase leading-relaxed text-flug-sage">Saved transmissions</span>
        <button type="button" className="text-flug-mint md:hidden" onClick={onClose} aria-label="Close sidebar">
          <PixelIcon name="close" size={12} />
        </button>
      </div>
      <div className="px-3 py-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="pixel-btn pixel-btn-primary w-[calc(100%-8px)] justify-start"
        >
          <PixelIcon name="plus" size={12} />
          New chat
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {isLoading && <p className="px-2 py-3 font-display text-[8px] text-flug-mint">Scanning…</p>}
        {isError && <p className="px-2 py-3 text-sm text-flug-mint">Couldn't load chats.</p>}
        {conversations?.length === 0 && (
          <p className="px-2 py-3 text-sm leading-relaxed text-muted-foreground">
            No transmissions yet. Say hi to Flug!
          </p>
        )}
        <ul className="space-y-2">
          {conversations?.map((c) => {
            const active = c.id === activeId;
            return (
              <li
                key={c.id}
                className={`group flex items-center gap-1 ${
                  active ? "bg-flug-mint text-flug-purple" : "text-flug-cream hover:bg-flug-dusk"
                }`}
              >
                <Link
                  to="/c/$threadId"
                  params={{ threadId: c.id }}
                  onClick={onNavigate}
                  className="min-w-0 flex-1 truncate px-3 py-2.5 text-[1rem]"
                >
                  {active ? "▸ " : ""}
                  {c.title}
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  className={`mr-1 flex shrink-0 items-center gap-1 px-2 py-2 font-display text-[7px] uppercase ${
                    confirmId === c.id
                      ? "bg-flug-sage text-flug-purple"
                      : "opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                  }`}
                  aria-label={confirmId === c.id ? `Confirm delete ${c.title}` : `Delete ${c.title}`}
                >
                  <PixelIcon name="trash" size={10} />
                  {confirmId === c.id && "Sure?"}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t-4 border-flug-purple p-3">
        {isGuest ? (
          <div className="space-y-2">
            <p className="text-sm leading-snug text-flug-mint">
              Guest pilot · chats saved on this device
            </p>
            <Link to="/auth" className="pixel-btn pixel-btn-soft w-[calc(100%-8px)]">
              Sign in
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="truncate text-sm text-flug-mint" title={session?.user.email ?? ""}>
              Pilot · {session?.user.email}
            </p>
            <button
              type="button"
              className="pixel-btn pixel-btn-dark w-[calc(100%-8px)]"
              onClick={async () => {
                await queryClient.cancelQueries();
                queryClient.clear();
                await signOut();
                navigate({ to: "/", replace: true });
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
