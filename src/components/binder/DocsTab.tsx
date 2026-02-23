import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { DocEntry } from "@/data/mock-phase5";

const extractionIcon: Record<DocEntry["extractionStatus"], { icon: typeof CheckCircle; cls: string }> = {
  complete: { icon: CheckCircle, cls: "text-emerald-400" },
  pending: { icon: Clock, cls: "text-amber-400" },
  failed: { icon: AlertCircle, cls: "text-crimson" },
};

const typeBadge: Record<DocEntry["type"], string> = {
  Primer: "bg-crimson/15 text-crimson",
  "Call Sheet": "bg-secondary text-muted-foreground",
  Schedule: "bg-secondary text-muted-foreground",
  Diagram: "bg-amber-900/30 text-amber-400",
  Rundown: "bg-secondary text-muted-foreground",
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DocsTab({ docs }: { docs: DocEntry[] }) {
  return (
    <div className="mt-4 steel-panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-[10px] tracking-wider uppercase">Type</TableHead>
            <TableHead className="text-[10px] tracking-wider uppercase">Document</TableHead>
            <TableHead className="text-[10px] tracking-wider uppercase">Version</TableHead>
            <TableHead className="text-[10px] tracking-wider uppercase">Uploaded By</TableHead>
            <TableHead className="text-[10px] tracking-wider uppercase">Date</TableHead>
            <TableHead className="text-[10px] tracking-wider uppercase">Extraction</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((doc) => {
            const { icon: StatusIcon, cls } = extractionIcon[doc.extractionStatus];
            return (
              <TableRow key={doc.id} className="border-border hover:bg-secondary/50">
                <TableCell>
                  <span className={`text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded ${typeBadge[doc.type]}`}>
                    {doc.type}
                  </span>
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{doc.name}</span>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">v{doc.version}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{doc.uploadedBy}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(doc.uploadedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className={`w-3.5 h-3.5 ${cls}`} />
                    <span className="text-[10px] text-muted-foreground capitalize">{doc.extractionStatus}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
