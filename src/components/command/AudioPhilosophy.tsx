import { useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AudioPhilosophyData {
  outputMode: "Stereo" | "5.1" | "Dual PGM";
  natsSource: string;
  announcerRouting: string;
  notes: string;
}

export const DEFAULT_AUDIO_PHILOSOPHY: AudioPhilosophyData = {
  outputMode: "Stereo",
  natsSource: "",
  announcerRouting: "",
  notes: "",
};

const OUTPUT_MODES: AudioPhilosophyData["outputMode"][] = ["Stereo", "5.1", "Dual PGM"];

const NATS_SOURCES = [
  "Arena Overhead Mics",
  "Truck Mix",
  "Crowd Mics L/R",
  "Courtside Mics",
  "Rinkside Mics",
  "Custom",
];

const ANNOUNCER_ROUTES = [
  "PGM Mix — Embedded",
  "Dedicated ISO — Announcer Only",
  "SAP Channel",
  "Dual Language Split",
  "Custom",
];

interface Props {
  data: AudioPhilosophyData;
  onChange: (data: AudioPhilosophyData) => void;
  readOnly?: boolean;
}

export function AudioPhilosophy({ data, onChange, readOnly }: Props) {
  const set = useCallback(<K extends keyof AudioPhilosophyData>(key: K, value: AudioPhilosophyData[K]) => {
    onChange({ ...data, [key]: value });
  }, [data, onChange]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
        <Volume2 className="w-3.5 h-3.5" />
        Audio Philosophy
      </h2>

      <div className="steel-panel p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Output Mode */}
          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Output Mode</Label>
            <div className="flex gap-2">
              {OUTPUT_MODES.map(mode => (
                <button key={mode}
                  onClick={() => !readOnly && set("outputMode", mode)}
                  disabled={readOnly}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-sm border text-xs font-medium transition-colors",
                    data.outputMode === mode
                      ? "border-crimson bg-crimson/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground",
                    readOnly && "pointer-events-none opacity-70"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Nats Source */}
          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Nats Source</Label>
            <Select value={data.natsSource} onValueChange={(v) => set("natsSource", v)} disabled={readOnly}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {NATS_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {data.natsSource === "Custom" && (
              <Input value={data.natsSource} onChange={(e) => set("natsSource", e.target.value)}
                placeholder="Custom source" className="h-8 text-xs mt-1" disabled={readOnly} />
            )}
          </div>

          {/* Announcer Routing */}
          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Announcer Routing</Label>
            <Select value={data.announcerRouting} onValueChange={(v) => set("announcerRouting", v)} disabled={readOnly}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select routing" /></SelectTrigger>
              <SelectContent>
                {ANNOUNCER_ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Audio Notes</Label>
          <Textarea value={data.notes} onChange={(e) => set("notes", e.target.value)}
            disabled={readOnly} placeholder="Audio mix details, special requirements…"
            className="min-h-[60px] text-sm resize-y" />
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className={cn(
            "text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border",
            data.outputMode ? "border-emerald-500/30 text-emerald-400 bg-emerald-900/10" : "border-border text-muted-foreground"
          )}>
            {data.outputMode || "No Mode"}
          </span>
          <span className={cn(
            "text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border",
            data.natsSource ? "border-emerald-500/30 text-emerald-400 bg-emerald-900/10" : "border-amber-500/30 text-amber-400 bg-amber-900/10"
          )}>
            Nats: {data.natsSource || "Unset"}
          </span>
          <span className={cn(
            "text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border",
            data.announcerRouting ? "border-emerald-500/30 text-emerald-400 bg-emerald-900/10" : "border-amber-500/30 text-amber-400 bg-amber-900/10"
          )}>
            Announcer: {data.announcerRouting || "Unset"}
          </span>
        </div>
      </div>
    </motion.section>
  );
}
