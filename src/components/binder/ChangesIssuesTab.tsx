import { CheckCircle, Clock, XCircle, AlertTriangle, ArrowUpCircle } from "lucide-react";
import type { ChangeEntry, Issue } from "@/data/mock-phase5";

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const changeIcon: Record<ChangeEntry["status"], { icon: typeof CheckCircle; cls: string }> = {
  confirmed: { icon: CheckCircle, cls: "text-muted-foreground" },
  proposed: { icon: Clock, cls: "text-crimson" },
  rejected: { icon: XCircle, cls: "text-muted-foreground/50" },
};

const issueStatusStyle: Record<Issue["status"], string> = {
  open: "bg-crimson/15 text-crimson",
  escalated: "bg-amber-900/30 text-amber-400",
  resolved: "bg-emerald-900/30 text-emerald-400",
};

const priorityStyle: Record<Issue["priority"], string> = {
  high: "text-crimson",
  medium: "text-amber-400",
  low: "text-muted-foreground",
};

export function ChangesIssuesTab({ changes, issues }: { changes: ChangeEntry[]; issues: Issue[] }) {
  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Changes timeline */}
      <div className="steel-panel p-5">
        <h3 className="text-[10px] tracking-wider uppercase text-muted-foreground mb-4">Change Timeline</h3>
        <div className="relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-4">
            {changes.map((ch) => {
              const { icon: Icon, cls } = changeIcon[ch.status];
              return (
                <div key={ch.id} className="relative flex items-start gap-3 pl-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 z-10 ${cls}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${ch.status === "rejected" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {ch.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {ch.author} · {timeAgo(ch.timestamp)}
                      {ch.status === "proposed" && <span className="ml-2 text-crimson">pending</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Issues */}
      <div className="steel-panel p-5">
        <h3 className="text-[10px] tracking-wider uppercase text-muted-foreground mb-4">Issues</h3>
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="flex items-start gap-3 p-3 rounded bg-secondary/50 hover:bg-secondary transition-colors">
              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${priorityStyle[issue.priority]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-foreground">{issue.title}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className={`px-1.5 py-0.5 rounded tracking-wider uppercase ${issueStatusStyle[issue.status]}`}>
                    {issue.status}
                  </span>
                  <span>{issue.assignee}</span>
                  <span>{timeAgo(issue.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
