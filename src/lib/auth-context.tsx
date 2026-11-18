import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  session: Session | null;
  ready: boolean;
  isGuest: boolean;
  error: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// One shared bootstrap so StrictMode double effects never create two guest sessions.
let bootPromise: Promise<void> | null = null;
async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    bootPromise ??= ensureSession();
    bootPromise
      .then(async () => {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      })
      .catch((e: unknown) => {
        console.error("Guest session failed", e);
        setError("Flug couldn't open a guest session. Please reload the page.");
        bootPromise = null;
      })
      .finally(() => setReady(true));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    bootPromise = ensureSession();
    await bootPromise;
  };

  const isGuest = Boolean(session?.user?.is_anonymous);

  return (
    <AuthContext.Provider value={{ session, ready, isGuest, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
