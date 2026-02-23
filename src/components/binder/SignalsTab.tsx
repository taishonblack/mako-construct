import { useState, useMemo } from "react";
import { Minus, Plus, Zap } from "lucide-react";
import { generateSignals } from "@/data/mock-signals";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";

interface SignalsTabProps {
  initialIsoCount: number;
  encodersAssigned: number;
}

export function SignalsTab({ initialIsoCount, encodersAssigned }: SignalsTabProps) {
  const [isoCount, setIsoCount] = useState(initialIsoCount);
  const signals = useMemo(() => generateSignals(isoCount), [isoCount]);

  const encodersRequired = Math.ceil(isoCount / 2);
  const shortfall = encodersRequired > encodersAssigned;

  return (
    <div className="mt-4 space-y-4">
      {/* ISO count control + encoder capacity */}
      <div className="flex flex-wrap items-center justify-between gap-4 steel-panel p-4">
        <div className="flex items-center gap-4">
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground">Set ISO Count</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsoCount((c) => Math.max(1, c - 1))}
              className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-crimson hover:text-foreground transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-10 text-center text-sm font-mono text-foreground">{isoCount}</span>
            <button
              onClick={() => setIsoCount((c) => Math.min(28, c + 1))}
              className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-crimson hover:text-foreground transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            Encoders: <span className={shortfall ? "text-crimson font-medium" : "text-foreground"}>{encodersAssigned}/{encodersRequired} required</span>
          </span>
          {shortfall && (
            <span className="flex items-center gap-1 text-crimson">
              <Zap className="w-3 h-3" />
              {encodersRequired - encodersAssigned} shortfall
            </span>
          )}
        </div>
      </div>

      {/* Signal grid */}
      <div className="steel-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-16 text-[10px] tracking-wider uppercase">ISO #</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">Production Alias</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">Onsite Patch</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">HQ Patch</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">Destination</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">Transport</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.map((signal) => (
              <TableRow key={signal.iso} className="border-border hover:bg-secondary/50">
                <TableCell className="font-mono text-xs text-crimson">{signal.iso}</TableCell>
                <TableCell className="text-sm text-foreground">{signal.productionAlias}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{signal.onsitePatch}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{signal.hqPatch}</TableCell>
                <TableCell>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    signal.destination === "Program"
                      ? "bg-crimson/15 text-crimson"
                      : signal.destination === "ISO Record"
                        ? "bg-secondary text-muted-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {signal.destination}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider">
                    {signal.transport}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
