import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flag, AlertTriangle, Lightbulb, Users, Send } from "lucide-react";
import { toast } from "sonner";
import { addReport, getReports, type Report } from "@/lib/safewalk-data";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/_app/report")({
  head: () => ({ meta: [{ title: "Report — SafeWalk" }] }),
  component: ReportPage,
});

const TYPES = [
  { id: "hazard", label: "Hazard", icon: AlertTriangle, color: "text-warn" },
  { id: "lighting", label: "Poor lighting", icon: Lightbulb, color: "text-caution" },
  { id: "loitering", label: "Suspicious activity", icon: Users, color: "text-danger" },
  { id: "other", label: "Other concern", icon: Flag, color: "text-accent" },
];

function ReportPage() {
  const [type, setType] = useState("hazard");
  const [note, setNote] = useState("");
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setReports(getReports());
    const h = () => setReports(getReports());
    window.addEventListener("safewalk:reports", h);
    return () => window.removeEventListener("safewalk:reports", h);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    const session = getSession();
    addReport({
      id: crypto.randomUUID(), type, note: note.trim(),
      createdAt: Date.now(), netid: session?.netid || "anon",
    });
    setNote("");
    toast.success("Report submitted — thanks for keeping the community safer");
  };

  return (
    <div className="h-full overflow-y-auto px-5 pb-6 pt-5">
      <div className="mb-5">
        <h1 className="font-display text-3xl text-foreground">Report a concern</h1>
        <p className="mt-1 text-sm text-muted-foreground">Help fellow Huskies. Your report is anonymous to other students.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Type</div>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => {
              const Icon = t.icon; const sel = type === t.id;
              return (
                <button key={t.id} type="button" onClick={() => setType(t.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                    sel ? "border-gold/60 bg-gold/10" : "border-border bg-surface-elevated"
                  }`}>
                  <Icon className={`h-4 w-4 ${t.color}`} />
                  <span className={sel ? "text-foreground" : "text-muted-foreground"}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">What happened?</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
            placeholder="Describe the location and what you noticed…"
            className="w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20" />
        </div>
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold to-[oklch(0.72_0.15_65)] py-3 text-sm font-semibold text-[oklch(0.18_0.03_260)] shadow shadow-gold/20 active:scale-[0.98]">
          <Send className="h-4 w-4" /> Submit report
        </button>
      </form>

      <div className="mt-6">
        <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Recent reports</div>
        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 py-8 text-center text-sm text-muted-foreground">No reports yet. Be the first to share.</div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => {
              const t = TYPES.find((x) => x.id === r.type) || TYPES[0]; const Icon = t.icon;
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-surface p-3.5">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${t.color}`} />
                      <span className="text-xs font-medium text-foreground">{t.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">{r.note}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}