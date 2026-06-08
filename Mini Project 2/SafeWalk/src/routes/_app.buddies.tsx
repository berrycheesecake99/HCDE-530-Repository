import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Check, Plus, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { GROUPS, getJoinedIds, setJoinedIds } from "@/lib/safewalk-data";

export const Route = createFileRoute("/_app/buddies")({
  head: () => ({ meta: [{ title: "Buddies — SafeWalk" }] }),
  component: BuddiesPage,
});

function BuddiesPage() {
  const [joined, setJoined] = useState<string[]>([]);
  useEffect(() => {
    setJoined(getJoinedIds());
    const h = () => setJoined(getJoinedIds());
    window.addEventListener("safewalk:groups", h);
    return () => window.removeEventListener("safewalk:groups", h);
  }, []);

  const toggle = (id: string) => {
    const next = joined.includes(id) ? joined.filter((x) => x !== id) : [...joined, id];
    setJoinedIds(next);
  };

  const sorted = [...GROUPS].sort((a, b) => {
    const aj = joined.includes(a.id) ? 0 : 1;
    const bj = joined.includes(b.id) ? 0 : 1;
    return aj - bj;
  });

  return (
    <div className="h-full overflow-y-auto px-5 pb-6 pt-5">
      <div className="mb-5">
        <h1 className="font-display text-3xl text-foreground">Walking buddies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find someone from your major to walk home with.
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((g) => {
          const isJoined = joined.includes(g.id);
          const online = g.members.filter((m) => m.status === "online").length;
          return (
            <motion.div
              layout
              key={g.id}
              className={`overflow-hidden rounded-2xl border transition ${
                isJoined ? "border-gold/40 bg-gold/5" : "border-border bg-surface"
              }`}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{g.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{g.members.length} members</span>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-safe shadow-[0_0_6px] shadow-safe" />
                      {online} online now
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggle(g.id)}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isJoined
                      ? "bg-surface-elevated text-muted-foreground hover:text-foreground"
                      : "bg-gold text-[oklch(0.18_0.03_260)] hover:brightness-110"
                  }`}
                >
                  {isJoined ? <><Check className="h-3 w-3" /> Joined</> : <><Plus className="h-3 w-3" /> Join</>}
                </button>
              </div>

              {isJoined && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t border-border/60"
                >
                  {g.members.map((m) => (
                    <div key={m.name} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated text-xs font-semibold text-foreground">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm text-foreground">{m.name}</div>
                          <div className={`text-[11px] ${m.status === "online" ? "text-safe" : "text-muted-foreground"}`}>
                            {m.status === "online" ? "Available now" : "Offline"}
                          </div>
                        </div>
                      </div>
                      {m.status === "online" && (
                        <button
                          onClick={() => toast.success(`Walk request sent to ${m.name}`)}
                          className="flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/25"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Walk together
                        </button>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}