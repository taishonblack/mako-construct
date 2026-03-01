import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { BinderStatus } from "@/stores/binder-store";

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

const PARTNERS = ["ESPN", "SportsNet CA", "WBD", "Fanatics", "Amazon", "Altitude"];
const STATUSES: BinderStatus[] = ["draft", "active", "completed", "archived"];
const TIMEZONES = [
  { value: "America/New_York", label: "ET (Eastern)" },
  { value: "America/Chicago", label: "CT (Central)" },
  { value: "America/Denver", label: "MT (Mountain)" },
  { value: "America/Los_Angeles", label: "PT (Pacific)" },
];

const BROADCAST_FEEDS = [
  "INTL Truck PGM", "RSN", "National", "League Clean", "Custom",
];

export interface BinderHeaderData {
  title: string;
  status: BinderStatus;
  eventDate: string;
  eventTime: string;
  timezone: string;
  awayTeam: string;
  homeTeam: string;
  venue: string;
  broadcastFeed: string;
  rehearsalDate: string;
  partner: string;
  partners: string[];
  techManagers: string[];
}

interface Props {
  data: BinderHeaderData;
  onChange: (data: BinderHeaderData) => void;
  readOnly?: boolean;
}

function DatePickerField({ label, value, onChange, disabled, placeholder }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }) {
  const dateValue = value ? parseISO(value) : undefined;
  return (
    <div className="space-y-1">
      <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={disabled}
            className={cn("w-full justify-start text-left font-normal h-9 text-sm", !dateValue && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-3 w-3" />
            {dateValue ? format(dateValue, "MMM d, yyyy") : placeholder || "Select date"}
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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">
      {children}{required && <span className="text-primary ml-0.5">*</span>}
    </Label>
  );
}

function MultiTagInput({ label, values, onChange, disabled, placeholder, suggestions }: {
  label: string; values: string[]; onChange: (v: string[]) => void; disabled?: boolean; placeholder?: string; suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addValue = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const removeValue = (val: string) => {
    onChange(values.filter(v => v !== val));
  };

  const filteredSuggestions = suggestions?.filter(s => 
    !values.includes(s) && s.toLowerCase().includes(input.toLowerCase())
  ) || [];

  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-sm bg-secondary border border-border text-foreground">
            {v}
            {!disabled && (
              <button onClick={() => removeValue(v)} className="text-muted-foreground hover:text-foreground ml-0.5">&times;</button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) { e.preventDefault(); addValue(input); }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="h-9 text-sm"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-sm shadow-lg max-h-40 overflow-y-auto">
              {filteredSuggestions.map(s => (
                <button key={s} onMouseDown={() => addValue(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/70 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BinderHeader({ data, onChange, readOnly }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [partnerOther, setPartnerOther] = useState(!PARTNERS.includes(data.partner) && data.partner !== "");

  const set = useCallback(<K extends keyof BinderHeaderData>(key: K, value: BinderHeaderData[K]) => {
    onChange({ ...data, [key]: value });
  }, [data, onChange]);

  const suggestedTitle = data.awayTeam && data.homeTeam ? `${data.awayTeam} @ ${data.homeTeam}` : "";

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Binder Header</h2>
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="steel-panel p-5 space-y-6">
          {/* ROW 1: Title + Status */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4">
            <div className="space-y-1">
              <FieldLabel required>Project Title</FieldLabel>
              <Input value={data.title} onChange={(e) => set("title", e.target.value)}
                disabled={readOnly} placeholder="e.g. NYR @ BOS — Standard" className="h-9 text-sm" />
              {suggestedTitle && !data.title && !readOnly && (
                <button onClick={() => set("title", suggestedTitle)}
                  className="text-[10px] text-primary hover:text-foreground mt-1 transition-colors">Use: {suggestedTitle}</button>
              )}
            </div>
            <div className="space-y-1">
              <FieldLabel>Status</FieldLabel>
              <Select value={data.status} onValueChange={(v) => set("status", v as BinderStatus)} disabled={readOnly}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ROW 2: Date / Time / Timezone */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-3">Schedule</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <DatePickerField label="Game Date" value={data.eventDate} onChange={(v) => set("eventDate", v)} disabled={readOnly} placeholder="Select date" />
              <div className="space-y-1">
                <FieldLabel>Game Time</FieldLabel>
                <Input type="time" value={data.eventTime} onChange={(e) => set("eventTime", e.target.value)}
                  disabled={readOnly} className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1">
                <FieldLabel>Timezone</FieldLabel>
                <Select value={data.timezone} onValueChange={(v) => set("timezone", v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DatePickerField label="Rehearsal Date" value={data.rehearsalDate} onChange={(v) => set("rehearsalDate", v)} disabled={readOnly} placeholder="Optional" />
            </div>
          </div>

          {/* ROW 3: Teams + Arena */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-3">Game Context</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <FieldLabel required>Away Team</FieldLabel>
                <Select value={data.awayTeam} onValueChange={(v) => set("awayTeam", v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {NHL_TEAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <FieldLabel required>Home Team</FieldLabel>
                <Select value={data.homeTeam} onValueChange={(v) => set("homeTeam", v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {NHL_TEAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <FieldLabel required>Arena</FieldLabel>
                <Select value={data.venue} onValueChange={(v) => set("venue", v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select arena" /></SelectTrigger>
                  <SelectContent>
                    {ARENAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    <SelectItem value="__custom__">Custom…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ROW 4: Broadcast + Network + Partners + Tech Managers */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-3">Production Info</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <FieldLabel>Broadcast Feed to Watch</FieldLabel>
                <Select value={data.broadcastFeed} onValueChange={(v) => set("broadcastFeed", v)} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {BROADCAST_FEEDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <FieldLabel>Broadcasting Network (Owner)</FieldLabel>
                {!partnerOther ? (
                  <Select value={PARTNERS.includes(data.partner) ? data.partner : "__other"} 
                    onValueChange={(v) => { if (v === "__other") { setPartnerOther(true); set("partner", ""); } else set("partner", v); }}
                    disabled={readOnly}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {PARTNERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      <SelectItem value="__other">Other…</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input value={data.partner} onChange={(e) => set("partner", e.target.value)}
                      disabled={readOnly} placeholder="Partner name" className="h-9 text-sm" />
                    <Button variant="ghost" size="sm" onClick={() => { setPartnerOther(false); set("partner", "ESPN"); }}
                      className="text-[10px]">List</Button>
                  </div>
                )}
              </div>
              <MultiTagInput
                label="Partners (multi-select)"
                values={data.partners}
                onChange={(v) => set("partners", v)}
                disabled={readOnly}
                placeholder="Type and press Enter…"
                suggestions={PARTNERS}
              />
              <MultiTagInput
                label="Show Tech Managers"
                values={data.techManagers}
                onChange={(v) => set("techManagers", v)}
                disabled={readOnly}
                placeholder="Type name and press Enter…"
              />
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}

export const DEFAULT_BINDER_HEADER: BinderHeaderData = {
  title: "",
  status: "draft",
  eventDate: new Date().toISOString().split("T")[0],
  eventTime: "19:00",
  timezone: "America/New_York",
  awayTeam: "",
  homeTeam: "",
  venue: "",
  broadcastFeed: "INTL Truck PGM",
  rehearsalDate: "",
  partner: "ESPN",
  partners: [],
  techManagers: [],
};
