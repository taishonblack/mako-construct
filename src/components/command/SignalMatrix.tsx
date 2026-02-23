import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import type { Signal } from "@/data/mock-signals";
import type { ReadinessReport } from "@/lib/readiness-engine";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";

interface SignalMatrixProps {
  signals: Signal[];
  report: ReadinessReport;
  onUpdateSignal: (iso: number, field: keyof Signal, value: string) => void;
}

function InlineInput({ value, onChange, mono }: { value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-transparent border-b border-transparent hover:border-border focus:border-crimson focus:outline-none text-sm py-0.5 transition-colors ${mono ? "font-mono text-xs text-muted-foreground" : "text-foreground"}`}
    />
  );
}

function InlineSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-[10px] font-mono px-1 py-0.5 rounded border border-transparent hover:border-border focus:border-crimson focus:outline-none text-muted-foreground uppercase tracking-wider transition-colors cursor-pointer"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-card text-foreground">{o}</option>
      ))}
    </select>
  );
}

export function SignalMatrix({ signals, report, onUpdateSignal }: SignalMatrixProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Signal Configuration Matrix</h2>

      <div className="steel-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-14 text-[10px] tracking-wider uppercase">ISO</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">Production Alias</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">Onsite Encoder</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">HQ Decoder</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase w-24">Transport</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase w-28">Destination</TableHead>
              <TableHead className="w-20 text-[10px] tracking-wider uppercase">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.map((signal) => {
              const isMapped = !!signal.encoderInput && !!signal.decoderOutput;
              return (
                <TableRow key={signal.iso} className="border-border hover:bg-secondary/50">
                  <TableCell className="font-mono text-xs text-crimson">{signal.iso}</TableCell>
                  <TableCell>
                    <InlineInput
                      value={signal.productionAlias}
                      onChange={(v) => onUpdateSignal(signal.iso, "productionAlias", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineInput
                      value={signal.encoderInput}
                      onChange={(v) => onUpdateSignal(signal.iso, "encoderInput", v)}
                      mono
                    />
                  </TableCell>
                  <TableCell>
                    <InlineInput
                      value={signal.decoderOutput}
                      onChange={(v) => onUpdateSignal(signal.iso, "decoderOutput", v)}
                      mono
                    />
                  </TableCell>
                  <TableCell>
                    <InlineSelect
                      value={signal.transport}
                      options={["SRT", "MPEG-TS"]}
                      onChange={(v) => onUpdateSignal(signal.iso, "transport", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineSelect
                      value={signal.destination}
                      options={["Program", "ISO Record", "Backup"]}
                      onChange={(v) => onUpdateSignal(signal.iso, "destination", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] tracking-wider uppercase ${isMapped ? "text-emerald-400" : "text-crimson"}`}>
                      {isMapped ? "Mapped" : "Gap"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Capacity summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div className={`steel-panel p-4 ${report.encoderShortfall > 0 ? "border-glow-red" : ""}`}>
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-2">Encoder Capacity</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-mono font-medium ${report.encoderShortfall > 0 ? "text-crimson" : "text-foreground"}`}>
              {report.encoderCapacity}
            </span>
            <span className="text-xs text-muted-foreground">/ {report.encoderRequired} required</span>
          </div>
          {report.encoderShortfall > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-crimson text-xs">
              <Zap className="w-3 h-3" />
              {report.encoderShortfall} shortfall
            </div>
          )}
        </div>

        <div className="steel-panel p-4">
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-2">Decoder Mapping</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-mono font-medium text-foreground">{report.decoderAssigned}</span>
            <span className="text-xs text-muted-foreground">/ {report.decoderTotal} assigned</span>
          </div>
        </div>

        <div className={`steel-panel p-4 ${!report.backupDefined ? "border-glow-red" : ""}`}>
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-2">Transport</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${report.transportComplete ? "text-foreground" : "text-crimson"}`}>
              {report.transportComplete ? "Primary ✓" : "Primary ✗"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className={`text-sm ${report.backupDefined ? "text-foreground" : "text-amber-400"}`}>
              {report.backupDefined ? "Backup ✓" : "No Backup"}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
