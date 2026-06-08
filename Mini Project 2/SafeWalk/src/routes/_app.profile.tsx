import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Bell, Shield, Settings } from "lucide-react";
import { clearSession, useSession } from "@/lib/session";
import { GROUPS, getJoinedIds, STORAGE } from "@/lib/safewalk-data";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — SafeWalk" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const router = useRouter();
  const session = useSession();
  const [displayName, setDisplayName] = useState("");
  const [joined, setJoined] = useState<string[]>([]);

  useEffect(() => {
    setJoined(getJoinedIds());
    setDisplayName(localStorage.getItem(STORAGE.displayName) || "");
    const h = () => setJoined(getJoinedIds());
    window.addEventListener("safewalk:groups", h);
    return () => window.removeEventListener("safewalk:groups", h);
  }, []);

  const saveName = (v: string) => {
    setDisplayName(v);
    localStorage.setItem(STORAGE.displayName, v);
  };

  const signOut = () => { clearSession(); router.navigate({ to: "/login", replace: true }); };

  const initial = (displayName || session?.netid || "?").charAt(0).toUpperCase();
  const joinedGroups = GROUPS.filter((g) => joined.includes(g.id));

  return (
    <div className="h-full overflow-y-auto px-5 pb-6 pt-5">
      <h1 className="mb-5 font-display text-3xl text-foreground">Profile</h1>

      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-surface-elevated p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-[oklch(0.7_0.16_60)] font-display text-3xl text-[oklch(0.18_0.03_260)] shadow-lg shadow-gold/30">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-foreground">{displayName || session?.netid || "Husky"}</div>
            <div className="truncate font-mono text-xs text-muted-foreground">{session?.netid}@uw.edu</div>
          </div>
        </div>
        <input value={displayName} onChange={(e) => saveName(e.target.value)}
          placeholder="Display name (optional)"
          className="mt-4 w-full rounded-xl border border-border bg-background/40 px-3.5 py-2.5 text-sm outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20" />
      </div>

      <div className="mt-6">
        <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          My groups ({joinedGroups.length})
        </div>
        {joinedGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 py-6 text-center text-sm text-muted-foreground">No groups joined yet</div>
        ) : (
          <div className="space-y-1.5">
            {joinedGroups.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-gold shadow-[0_0_8px] shadow-gold/60" />
                <div className="flex-1 text-sm text-foreground">{g.name}</div>
                <div className="text-[11px] text-muted-foreground">{g.members.length}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-1.5">
        <SettingsRow icon={<Bell className="h-4 w-4" />} label="Notifications" hint="On" />
        <SettingsRow icon={<Shield className="h-4 w-4" />} label="Privacy & data" hint="Local only" />
        <SettingsRow icon={<Settings className="h-4 w-4" />} label="App preferences" hint="" />
      </div>

      <button onClick={signOut} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-sos/30 bg-sos/10 py-3 text-sm font-semibold text-sos hover:bg-sos/20">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">SafeWalk UW · Prototype build</p>
    </div>
  );
}

function SettingsRow({ icon, label, hint }: { icon: React.ReactNode; label: string; hint: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition hover:border-gold/30">
      <span className="text-gold">{icon}</span>
      <span className="flex-1 text-sm text-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
    </button>
  );
}