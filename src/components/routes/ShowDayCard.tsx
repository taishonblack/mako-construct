import type { SignalRoute } from "@/stores/route-store";
import { cn } from "@/lib/utils";

interface Props {
  route: SignalRoute;
  onClick?: () => void;
}

function getRouteStatus(r: SignalRoute): "ok" | "warn" | "unknown" {
  const has = (v: string | undefined | null) => !!v && v.trim() !== "";
  if (!has(r.transport.type)) return "warn";
  if (!has(r.encoder.deviceName) || !has(r.decoder.deviceName)) return "warn";
  if (!has(r.alias.productionName)) return "unknown";
  return "ok";
}

const STATUS: Record<string, { dot: string; label: string }> = {
  ok: { dot: "bg-emerald-500", label: "Live" },
  warn: { dot: "bg-amber-400", label: "Partial" },
  unknown: { dot: "bg-muted-foreground/30", label: "Unknown" },
};

export function ShowDayCard({ route, onClick }: Props) {
  const status = getRouteStatus(route);
  const s = STATUS[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-all",
        "hover:border-primary/40 cursor-pointer",
        status === "ok" ? "border-border" : "border-amber-500/30"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn("w-3 h-3 rounded-full shrink-0", s.dot)} />
        <span className="text-base font-semibold text-foreground truncate">
          {route.alias.productionName || route.routeName}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
        {s.label}
      </span>
    </button>
  );
}
