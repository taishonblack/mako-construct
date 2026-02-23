import type { CommEntry } from "@/data/mock-phase5";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

const typeBadge: Record<CommEntry["type"], string> = {
  "Clear-Com": "bg-crimson/15 text-crimson",
  "LQ": "bg-secondary text-muted-foreground",
  "Hot Mic": "bg-amber-900/30 text-amber-400",
};

export function CommsTab({ comms }: { comms: CommEntry[] }) {
  const grouped = ["Clear-Com", "LQ", "Hot Mic"] as const;

  return (
    <div className="mt-4 space-y-4">
      {grouped.map((type) => {
        const entries = comms.filter((c) => c.type === type);
        if (entries.length === 0) return null;
        return (
          <div key={type} className="steel-panel overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-[10px] tracking-wider uppercase text-muted-foreground">{type}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-24 text-[10px] tracking-wider uppercase">Channel</TableHead>
                  <TableHead className="text-[10px] tracking-wider uppercase">Assignment</TableHead>
                  <TableHead className="text-[10px] tracking-wider uppercase">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-mono text-xs text-crimson">{entry.channel}</TableCell>
                    <TableCell className="text-sm text-foreground">{entry.assignment}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}
