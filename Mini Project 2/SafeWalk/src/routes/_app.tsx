import { createFileRoute, Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Users, Flag, User, Phone, X, Shield } from "lucide-react";
import { Toaster } from "sonner";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

const TABS = [
  { to: "/navigate", label: "Route", icon: Compass },
  { to: "/buddies", label: "Buddies", icon: Users },
  { to: "/report", label: "Report", icon: Flag },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function AppShell() {
  const router = useRouter();
  const location = useLocation();
  const [sosOpen, setSosOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) router.navigate({ to: "/login", replace: true });
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <div className="relative mx-auto flex h-dvh min-h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="relative z-30 flex items-center justify-between border-b border-border/60 bg-background/80 px-5 py-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-[oklch(0.7_0.16_60)] shadow shadow-gold/30">
            <Shield className="h-4.5 w-4.5 text-[oklch(0.18_0.03_260)]" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-lg leading-none text-foreground">SafeWalk</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">University District</div>
          </div>
        </div>
        <button
          onClick={() => setSosOpen(true)}
          className="sos-pulse flex h-11 items-center gap-1.5 rounded-full bg-sos px-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-sos/40 transition active:scale-95"
        >
          <Phone className="h-3.5 w-3.5" strokeWidth={2.5} />
          SOS
        </button>
      </header>

      {/* Content */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="relative z-30 grid grid-cols-4 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium uppercase tracking-wider transition"
            >
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gold"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={`h-5 w-5 transition ${active ? "text-gold" : "text-muted-foreground"}`}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* SOS Sheet */}
      <AnimatePresence>
        {sosOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSosOpen(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-3xl border-t border-border bg-surface p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-2xl"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-2xl">Emergency contacts</h2>
                <button onClick={() => setSosOpen(false)} className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-elevated">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2.5">
                <EmergencyRow href="tel:911" label="911" desc="Emergency services" tone="danger" />
                <EmergencyRow href="tel:2066857233" label="206-685-7233" desc="UW SafeCampus" />
                <EmergencyRow href="tel:2066859255" label="206-685-WALK" desc="Husky NightWalk escort" />
                <EmergencyRow href="tel:988" label="988" desc="Suicide & Crisis Lifeline" />
              </div>
              <p className="mt-5 text-center text-xs text-muted-foreground">
                Tap to call. Hold your phone ready.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toaster theme="dark" position="top-center" toastOptions={{ style: { background: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--foreground)" } }} />
    </div>
  );
}

function EmergencyRow({ href, label, desc, tone }: { href: string; label: string; desc: string; tone?: "danger" }) {
  return (
    <a
      href={href}
      className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition active:scale-[0.98] ${
        tone === "danger"
          ? "border-sos/40 bg-sos/10 hover:bg-sos/20"
          : "border-border bg-surface-elevated hover:border-gold/40"
      }`}
    >
      <div>
        <div className={`font-mono text-lg font-semibold ${tone === "danger" ? "text-sos" : "text-foreground"}`}>{label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
      </div>
      <Phone className={`h-5 w-5 ${tone === "danger" ? "text-sos" : "text-gold"}`} />
    </a>
  );
}