import { useEffect, useState } from "react";

const KEY = "safewalk_session";

export type Session = { netid: string } | null;

export function getSession(): Session {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(netid: string) {
  localStorage.setItem(KEY, JSON.stringify({ netid }));
  window.dispatchEvent(new Event("safewalk:session"));
}

export function clearSession() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("safewalk:session"));
}

export function useSession(): Session {
  const [session, setSession] = useState<Session>(null);
  useEffect(() => {
    setSession(getSession());
    const handler = () => setSession(getSession());
    window.addEventListener("safewalk:session", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("safewalk:session", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return session;
}