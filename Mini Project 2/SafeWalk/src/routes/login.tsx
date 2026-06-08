import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { saveSession } from "@/lib/session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SafeWalk UW" },
      { name: "description", content: "Sign in to SafeWalk with your UW NetID." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [netid, setNetid] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!netid.trim()) return;
    setLoading(true);
    setTimeout(() => {
      saveSession(netid.trim());
      router.navigate({ to: "/navigate" });
    }, 1100);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[40vh] w-[60vw] rounded-full bg-accent/15 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-gold/30 blur-2xl" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-[oklch(0.7_0.16_60)] shadow-lg shadow-gold/30">
              <Shield className="h-8 w-8 text-[oklch(0.18_0.03_260)]" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="font-display text-5xl tracking-tight text-foreground">
            SafeWalk<span className="text-gold">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Walk safe around the <span className="text-foreground/80">U-District</span>
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-surface/60 p-7 backdrop-blur-xl">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              UW NetID
            </label>
            <input
              value={netid}
              onChange={(e) => setNetid(e.target.value)}
              placeholder="e.g. jdoe"
              autoComplete="off"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-gold to-[oklch(0.72_0.15_65)] px-4 py-3.5 text-sm font-semibold text-[oklch(0.18_0.03_260)] shadow-lg shadow-gold/20 transition hover:shadow-gold/40 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in with UW NetID…
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="pt-1 text-center text-[11px] text-muted-foreground/70">
            Prototype — not connected to real UW authentication
          </p>
        </form>
      </motion.div>
    </div>
  );
}