import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, Wand2, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { applyCRPreset, CR_PRESETS } from "@/data/cr-presets";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

// --- NHL Teams ---
const NHL_TEAMS = [
  "ANA","ARI","BOS","BUF","CAR","CBJ","CGY","CHI","COL","DAL",
  "DET","EDM","FLA","LAK","MIN","MTL","NJD","NSH","NYI","NYR",
  "OTT","PHI","PIT","SEA","SJS","STL","TBL","TOR","VAN","VGK","WPG","WSH",
];

const ARENAS = [
  "TD Garden", "Madison Square Garden", "Scotiabank Arena", "Bell Centre",
  "Amalie Arena", "PPG Paints Arena", "Wells Fargo Center", "Capital One Arena",
  "Prudential Center", "KeyBank Center", "Amerant Bank Arena", "Little Caesars Arena",
  "Canadian Tire Centre", "Nationwide Arena", "PNC Arena", "UBS Arena",
  "American Airlines Center", "Ball Arena", "T-Mobile Arena", "Rogers Place",
  "Scotiabank Saddledome", "Rogers Arena", "Crypto.com Arena", "SAP Center",
  "Honda Center", "Climate Pledge Arena", "Xcel Energy Center", "Enterprise Center",
  "Canada Life Centre", "Mullett Arena", "Bridgestone Arena", "United Center",
];

const BROADCAST_FEEDS = [
  "INTL Truck PGM", "RSN", "National", "League Clean", "Custom",
];

export interface StaffEntry {
  id: string;
  role: string;
  name: string;
  panelPosition: string;
}

export interface InternalLQEntry {
  id: string;
  person: string;
  role: string;
  lqPosition: string;
}

export interface EventCommandHeaderData {
  projectTitle: string;
  showDate: string;
  showTime: string;
  rehearsalDate: string;
  nhlGame: string;
  arena: string;
  broadcastFeed: string;
  customBroadcastFeed: string;
  controlRoom: "23" | "26";
  staff: StaffEntry[];
  onsiteTechManager: string;
  internalLQ: InternalLQEntry[];
  externalLQPorts: { E: string; F: string; G: string; H: string };
  notes: string;
  // Contribution Naming
  txPrefix: string;
  txFormat: string;
  rxPrefix: string;
  rxFormat: string;
}

export const DEFAULT_EVENT_HEADER: EventCommandHeaderData = {
  projectTitle: "",
  showDate: "",
  showTime: "19:00",
  rehearsalDate: "",
  nhlGame: "",
  arena: "",
  broadcastFeed: "INTL Truck PGM",
  customBroadcastFeed: "",
  controlRoom: "23",
  staff: [
    { id: "s1", role: "Producer", name: "", panelPosition: "" },
    { id: "s2", role: "Director", name: "", panelPosition: "" },
    { id: "s3", role: "TD", name: "", panelPosition: "" },
    { id: "s4", role: "Audio", name: "", panelPosition: "" },
    { id: "s5", role: "Graphics", name: "", panelPosition: "" },
  ],
  onsiteTechManager: "",
  internalLQ: [],
  externalLQPorts: { E: "", F: "", G: "", H: "" },
  notes: "",
  txPrefix: "TX",
  txFormat: "TX-ENC{##}-{IN##}",
  rxPrefix: "RX",
  rxFormat: "RX-CR{23|26}-DEC{##}-{OUT##}",
};

interface Props {
  data: EventCommandHeaderData;
  onChange: (data: EventCommandHeaderData) => void;
  readOnly?: boolean;
  onGenerateTxRx?: () => void;
}

function DatePickerField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const dateValue = value ? parseISO(value) : undefined;
  return (
    <div className="space-y-1">
      <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={disabled}
            className={cn("w-full justify-start text-left font-normal h-9 text-sm", !dateValue && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-3 w-3" />
            {dateValue ? format(dateValue, "MMM d, yyyy") : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateValue} onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
            className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function EventCommandHeader({ data, onChange, readOnly, onGenerateTxRx }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const set = useCallback(<K extends keyof EventCommandHeaderData>(key: K, value: EventCommandHeaderData[K]) => {
    onChange({ ...data, [key]: value });
  }, [data, onChange]);

  const updateStaff = useCallback((id: string, field: keyof StaffEntry, value: string) => {
    set("staff", data.staff.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, [data, set]);

  const addStaff = useCallback(() => {
    set("staff", [...data.staff, { id: `s-${Date.now()}`, role: "", name: "", panelPosition: "" }]);
  }, [data, set]);

  const removeStaff = useCallback((id: string) => {
    set("staff", data.staff.filter(s => s.id !== id));
  }, [data, set]);

  const updateLQ = useCallback((id: string, field: keyof InternalLQEntry, value: string) => {
    set("internalLQ", data.internalLQ.map(l => l.id === id ? { ...l, [field]: value } : l));
  }, [data, set]);

  const addLQ = useCallback(() => {
    set("internalLQ", [...data.internalLQ, { id: `lq-${Date.now()}`, person: "", role: "", lqPosition: "" }]);
  }, [data, set]);

  const removeLQ = useCallback((id: string) => {
    set("internalLQ", data.internalLQ.filter(l => l.id !== id));
  }, [data, set]);

  const setExtPort = useCallback((port: "E" | "F" | "G" | "H", value: string) => {
    set("externalLQPorts", { ...data.externalLQPorts, [port]: value });
  }, [data, set]);

  const staffNames = data.staff.filter(s => s.name.trim()).map(s => s.name);

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Event Command Header</h2>
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="steel-panel p-5 space-y-6">
          {/* EVENT IDENTITY */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-crimson block mb-3">Event Identity</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Project Title</Label>
                <Input value={data.projectTitle} onChange={(e) => set("projectTitle", e.target.value)}
                  disabled={readOnly} placeholder="e.g. NYR @ BOS — Alt German Feed" className="h-9 text-sm" />
              </div>
              <DatePickerField label="Show Date" value={data.showDate} onChange={(v) => set("showDate", v)} disabled={readOnly} />
              <div className="space-y-1">
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Show Time (ET)</Label>
                <Input type="time" value={data.showTime} onChange={(e) => set("showTime", e.target.value)}
                  disabled={readOnly} className="h-9 text-sm font-mono" />
              </div>
              <DatePickerField label="Rehearsal Date" value={data.rehearsalDate} onChange={(v) => set("rehearsalDate", v)} disabled={readOnly} />
            </div>
          </div>

          {/* GAME CONTEXT */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-crimson block mb-3">Game Context</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">NHL Game</Label>
                <Select value={data.nhlGame} onValueChange={(v) => set("nhlGame", v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select or type" /></SelectTrigger>
                  <SelectContent>
                    {NHL_TEAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    <SelectItem value="__custom__">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {data.nhlGame === "__custom__" && (
                  <Input value={data.nhlGame} onChange={(e) => set("nhlGame", e.target.value)}
                    placeholder="Custom game" className="h-8 text-xs mt-1" disabled={readOnly} />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Arena</Label>
                <Select value={data.arena} onValueChange={(v) => set("arena", v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select arena" /></SelectTrigger>
                  <SelectContent>
                    {ARENAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    <SelectItem value="__custom__">Custom…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Broadcast Feed to Watch</Label>
                <Select value={data.broadcastFeed} onValueChange={(v) => set("broadcastFeed", v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BROADCAST_FEEDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
                {data.broadcastFeed === "Custom" && (
                  <Input value={data.customBroadcastFeed} onChange={(e) => set("customBroadcastFeed", e.target.value)}
                    placeholder="Custom feed" className="h-8 text-xs mt-1" disabled={readOnly} />
                )}
              </div>
            </div>
          </div>

          {/* FACILITY */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-crimson block mb-3">Facility</span>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Control Room</Label>
                <div className="flex gap-4">
                  {(["23", "26"] as const).map(cr => (
                    <label key={cr} className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-sm border cursor-pointer transition-colors text-sm",
                      data.controlRoom === cr ? "border-crimson bg-crimson/10 text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground",
                      readOnly && "pointer-events-none opacity-70"
                    )}>
                      <input type="radio" name="controlRoom" value={cr} checked={data.controlRoom === cr}
                        onChange={() => {
                          if (!readOnly) {
                            const updated = applyCRPreset(data, cr);
                            onChange(updated);
                          }
                        }} disabled={readOnly} className="sr-only" />
                      CR-{cr}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Settings2 className="w-3 h-3" />
                  <span>Preset: <span className="font-mono text-foreground">{CR_PRESETS[data.controlRoom].label}</span></span>
                </div>
                <span className="text-[10px] text-muted-foreground">—</span>
                <span className="text-[10px] text-muted-foreground">{CR_PRESETS[data.controlRoom].decoderNamingNote}</span>
              </div>
              {!readOnly && (
                <Button variant="outline" size="sm" onClick={() => onChange(applyCRPreset(data, data.controlRoom))}
                  className="text-[10px] tracking-wider uppercase">
                  <Settings2 className="w-3 h-3 mr-1" /> Re-apply CR-{data.controlRoom} Preset
                </Button>
              )}
            </div>
          </div>

          {/* STAFF */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-crimson block mb-3">Staff</span>
            <div className="steel-panel overflow-hidden mb-3">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] tracking-wider uppercase">Role</TableHead>
                    <TableHead className="text-[10px] tracking-wider uppercase">Name</TableHead>
                    <TableHead className="text-[10px] tracking-wider uppercase">Panel / Position</TableHead>
                    {!readOnly && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.staff.map(s => (
                    <TableRow key={s.id} className="border-border hover:bg-secondary/50 group">
                      <TableCell className="p-1">
                        <Input value={s.role} onChange={(e) => updateStaff(s.id, "role", e.target.value)}
                          disabled={readOnly} className="h-8 text-xs border-0 bg-transparent" placeholder="Role" />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input value={s.name} onChange={(e) => updateStaff(s.id, "name", e.target.value)}
                          disabled={readOnly} className="h-8 text-xs border-0 bg-transparent" placeholder="Name" />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input value={s.panelPosition} onChange={(e) => updateStaff(s.id, "panelPosition", e.target.value)}
                          disabled={readOnly} className="h-8 text-xs border-0 bg-transparent font-mono" placeholder="Panel" />
                      </TableCell>
                      {!readOnly && (
                        <TableCell className="p-1">
                          <Button variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-crimson opacity-0 group-hover:opacity-100"
                            onClick={() => removeStaff(s.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!readOnly && (
              <Button variant="ghost" size="sm" onClick={addStaff}
                className="text-[10px] tracking-wider uppercase text-muted-foreground hover:text-crimson">
                <Plus className="w-3 h-3 mr-1" /> Add Staff
              </Button>
            )}
            <div className="mt-3 space-y-1">
              <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Onsite Tech Manager</Label>
              <Select value={data.onsiteTechManager} onValueChange={(v) => set("onsiteTechManager", v)} disabled={readOnly}>
                <SelectTrigger className="h-9 text-sm w-64"><SelectValue placeholder="Select from staff" /></SelectTrigger>
                <SelectContent>
                  {staffNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  <SelectItem value="__other__">Other…</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CONTRIBUTION NAMING SCHEME */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-crimson block mb-3">Contribution Naming Scheme</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">TX Format</Label>
                <Input value={data.txFormat} onChange={(e) => set("txFormat", e.target.value)}
                  disabled={readOnly} className="h-9 text-sm font-mono" placeholder="TX-ENC{##}-{IN##}" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">RX Format</Label>
                <Input value={data.rxFormat} onChange={(e) => set("rxFormat", e.target.value)}
                  disabled={readOnly} className="h-9 text-sm font-mono" placeholder="RX-CR{23|26}-DEC{##}-{OUT##}" />
              </div>
            </div>
            {!readOnly && onGenerateTxRx && (
              <Button variant="outline" size="sm" onClick={onGenerateTxRx} className="mt-3 text-[10px] tracking-wider uppercase">
                <Wand2 className="w-3 h-3 mr-1" /> Generate Missing TX/RX
              </Button>
            )}
          </div>

          {/* COMMS — Internal LQ */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-crimson block mb-3">Internal LQ</span>
            <div className="steel-panel overflow-hidden mb-3">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] tracking-wider uppercase">Person</TableHead>
                    <TableHead className="text-[10px] tracking-wider uppercase">Role</TableHead>
                    <TableHead className="text-[10px] tracking-wider uppercase">LQ Position</TableHead>
                    {!readOnly && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.internalLQ.map(l => (
                    <TableRow key={l.id} className="border-border hover:bg-secondary/50 group">
                      <TableCell className="p-1">
                        <Input value={l.person} onChange={(e) => updateLQ(l.id, "person", e.target.value)}
                          disabled={readOnly} className="h-8 text-xs border-0 bg-transparent" placeholder="Name" />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input value={l.role} onChange={(e) => updateLQ(l.id, "role", e.target.value)}
                          disabled={readOnly} className="h-8 text-xs border-0 bg-transparent" placeholder="Role" />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input value={l.lqPosition} onChange={(e) => updateLQ(l.id, "lqPosition", e.target.value)}
                          disabled={readOnly} className="h-8 text-xs border-0 bg-transparent font-mono" placeholder="LQ-##" />
                      </TableCell>
                      {!readOnly && (
                        <TableCell className="p-1">
                          <Button variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-crimson opacity-0 group-hover:opacity-100"
                            onClick={() => removeLQ(l.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!readOnly && (
              <Button variant="ghost" size="sm" onClick={addLQ}
                className="text-[10px] tracking-wider uppercase text-muted-foreground hover:text-crimson">
                <Plus className="w-3 h-3 mr-1" /> Add LQ
              </Button>
            )}

            {/* External LQ Ports */}
            <div className="mt-4">
              <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground block mb-2">External LQ Ports</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["E", "F", "G", "H"] as const).map(port => (
                  <div key={port} className="space-y-1">
                    <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-mono">Port {port}</Label>
                    <Input value={data.externalLQPorts[port]}
                      onChange={(e) => setExtPort(port, e.target.value)}
                      disabled={readOnly} className="h-8 text-xs font-mono" placeholder="Assignment" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-crimson block mb-3">Notes</span>
            <Textarea value={data.notes} onChange={(e) => set("notes", e.target.value)}
              disabled={readOnly} placeholder="Production notes, special requirements, crew details…"
              className="min-h-[100px] text-sm resize-y" />
          </div>
        </div>
      )}
    </motion.section>
  );
}
