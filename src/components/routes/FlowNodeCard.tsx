import { cn } from "@/lib/utils";

export type NodeKind = "source" | "encoder" | "transport" | "cloud" | "decoder" | "router" | "output";
export type NodeStatus = "ok" | "warn" | "error" | "offline" | "unknown";

export interface FlowNode {
  kind: NodeKind;
  title: string;
  primary: string;
  secondary: string;
  status: NodeStatus;
}

const STATUS_DOT: Record<NodeStatus, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-400",
  error: "bg-red-500",
  offline: "bg-muted-foreground/40",
  unknown: "bg-muted-foreground/20",
};

const KIND_LABEL: Record<NodeKind, string> = {
  source: "SOURCE",
  encoder: "ENCODER",
  transport: "TRANSPORT",
  cloud: "CLOUD",
  decoder: "DECODER",
  router: "ROUTER",
  output: "OUTPUT",
};

interface Props {
  node: FlowNode;
  isActive?: boolean;
  onClick?: () => void;
}

export function FlowNodeCard({ node, isActive, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start text-left rounded-md border bg-card p-3 min-w-[180px] max-w-[220px] shrink-0 transition-all duration-150",
        "hover:border-primary/50 hover:bg-secondary/40 cursor-pointer",
        isActive ? "border-primary/60 glow-red-subtle" : "border-border",
        !node.primary || node.primary === "—" ? "opacity-50" : ""
      )}
    >
      {/* Status dot */}
      <span className={cn("absolute top-2.5 right-2.5 w-2 h-2 rounded-full", STATUS_DOT[node.status])} />

      <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
        {KIND_LABEL[node.kind]}
      </span>
      <span className="text-xs font-mono font-semibold text-foreground mt-1 truncate w-full">
        {node.primary || "Not set"}
      </span>
      <span className="text-[10px] text-muted-foreground truncate w-full mt-0.5">
        {node.secondary || "Tap to configure"}
      </span>
    </button>
  );
}
