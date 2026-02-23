import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BinderStatus } from "@/stores/binder-store";
import { templateStore, type BinderTemplate } from "@/stores/template-store";
import { CANONICAL_SIGNAL_NAMES } from "@/data/mock-signals";

const NHL_TEAMS = [
  "ANA", "ARI", "BOS", "BUF", "CGY", "CAR", "CHI", "COL", "CBJ", "DAL",
  "DET", "EDM", "FLA", "LAK", "MIN", "MTL", "NSH", "NJD", "NYI", "NYR",
  "OTT", "PHI", "PIT", "SJS", "SEA", "STL", "TBL", "TOR", "VAN", "VGK",
  "WPG", "WSH",
];
const GAME_TYPES = ["Regular Season", "Playoffs", "Stadium Series", "Winter Classic", "Preseason"];
const SHOW_TYPES = ["Standard", "Alt Language", "Animated", "Remote Call", "Studio Alt", "Other"];
const PARTNERS = ["ESPN", "WBD", "RSN", "SportsNet", "HBO Max", "Apple TV", "FOX Sports", "TNT Sports", "ABC", "Other"];
const STATUSES: BinderStatus[] = ["draft", "active", "completed", "archived"];
const ISO_PRESETS = [8, 12, 16, 18, 24];
const TRANSPORTS = ["SRT", "MPEG-TS", "Fiber", "RIST", "Other"];
const COMMERCIALS_OPTIONS = ["local-insert", "pass-through", "none", "Other"];
const SITE_TYPES = ["Arena", "Studio", "Hybrid", "Remote"];
const TIMEZONES = [
  { value: "America/New_York", label: "ET (Eastern)" },
  { value: "America/Chicago", label: "CT (Central)" },
  { value: "America/Denver", label: "MT (Mountain)" },
  { value: "America/Los_Angeles", label: "PT (Pacific)" },
  { value: "America/Anchorage", label: "AKT (Alaska)" },
  { value: "Pacific/Honolulu", label: "HT (Hawaii)" },
  { value: "Europe/London", label: "GMT (London)" },
];
const SEASONS = ["2025–26", "2026–27", "2024–25"];

// --- Built-in templates ---
interface BuiltInTemplate {
  name: string;
  description: string;
  defaults: Partial<BinderFormData>;
}

const BUILTIN_TEMPLATES: BuiltInTemplate[] = [
  {
    name: "Standard Game",
    description: "Full live NHL game production — 18 ISOs, SRT primary, return feed",
    defaults: {
      showType: "Standard", isoCount: 18, returnRequired: true,
      commercials: "local-insert", primaryTransport: "SRT", backupTransport: "MPEG-TS",
      siteType: "Arena", signalNamingMode: "iso", gameType: "Regular Season",
      encoderInputsPerUnit: 2, encoderCount: 10, decoderOutputsPerUnit: 4, decoderCount: 5,
    },
  },
  {
    name: "Alt Language Studio",
    description: "Studio-based alt language feed — 8 ISOs, no return, pass-through",
    defaults: {
      showType: "Alt Language", isoCount: 8, returnRequired: false,
      commercials: "pass-through", primaryTransport: "SRT", backupTransport: "MPEG-TS",
      siteType: "Studio", signalNamingMode: "iso", gameType: "Regular Season",
      encoderInputsPerUnit: 2, encoderCount: 4, decoderOutputsPerUnit: 4, decoderCount: 2,
    },
  },
  {
    name: "Remote Call (Bitfire)",
    description: "Remote call show — 12 ISOs, RIST transport, return required",
    defaults: {
      showType: "Remote Call", isoCount: 12, returnRequired: true,
      commercials: "none", primaryTransport: "RIST", backupTransport: "SRT",
      siteType: "Remote", signalNamingMode: "iso", gameType: "Regular Season",
      encoderInputsPerUnit: 2, encoderCount: 6, decoderOutputsPerUnit: 4, decoderCount: 3,
    },
  },
  {
    name: "Animated (Beyond Sports)",
    description: "Animated/virtual production — 6 ISOs, fiber transport, no return",
    defaults: {
      showType: "Animated", isoCount: 6, returnRequired: false,
      commercials: "none", primaryTransport: "Fiber", backupTransport: "SRT",
      siteType: "Studio", signalNamingMode: "iso", gameType: "Regular Season",
      encoderInputsPerUnit: 2, encoderCount: 3, decoderOutputsPerUnit: 4, decoderCount: 2,
    },
  },
  {
    name: "Stadium Series Special",
    description: "Outdoor stadium event — 24 ISOs, dual SRT/MPEG-TS, full return, canonical signals",
    defaults: {
      showType: "Standard", isoCount: 24, returnRequired: true,
      commercials: "local-insert", primaryTransport: "SRT", backupTransport: "MPEG-TS",
      siteType: "Arena", signalNamingMode: "canonical", gameType: "Stadium Series",
      canonicalSignals: ["Speedy", "Supra", "Handheld Left", "Handheld Right", "Home Bench", "Away Bench", "Beauty", "Overhead", "Jib", "Steadicam", "High Home", "High Away", "Slash Left", "Slash Right", "Baseline Left", "Baseline Right", "Rail Low Left", "Rail Low Right", "Fan Cam", "Tunnel Cam", "Aerial", "Sky Cam", "Scoreboard", "Press Row"],
      encoderInputsPerUnit: 2, encoderCount: 12, decoderOutputsPerUnit: 4, decoderCount: 6,
    },
  },
  {
    name: "Winter Classic Special",
    description: "Outdoor classic event — 22 ISOs, fiber primary, full return, canonical signals",
    defaults: {
      showType: "Standard", isoCount: 22, returnRequired: true,
      commercials: "local-insert", primaryTransport: "Fiber", backupTransport: "SRT",
      siteType: "Arena", signalNamingMode: "canonical", gameType: "Winter Classic",
      canonicalSignals: ["Speedy", "Supra", "Handheld Left", "Handheld Right", "Home Bench", "Away Bench", "Beauty", "Overhead", "Jib", "Steadicam", "High Home", "High Away", "Slash Left", "Slash Right", "Aerial", "Sky Cam", "Fan Cam", "Coach Cam", "Tunnel Cam", "Scoreboard", "Rail Low Left", "Rail Low Right"],
      encoderInputsPerUnit: 2, encoderCount: 11, decoderOutputsPerUnit: 4, decoderCount: 6,
    },
  },
];

export interface BinderFormData {
  title: string;
  league: string;
  containerId: string;
  gameType: string;
  season: string;
  eventDate: string;
  eventTime: string;
  timezone: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  siteType: string;
  studioLocation: string;
  showType: string;
  customShowType: string;
  partner: string;
  status: BinderStatus;
  isoCount: number;
  returnRequired: boolean;
  commercials: string;
  customCommercials: string;
  primaryTransport: string;
  customPrimaryTransport: string;
  backupTransport: string;
  customBackupTransport: string;
  notes: string;
  // Signal preset
  signalNamingMode: string;
  canonicalSignals: string[];
  customSignalNames: string;
  // Topology
  encoderInputsPerUnit: number;
  encoderCount: number;
  decoderOutputsPerUnit: number;
  decoderCount: number;
  autoAllocate: boolean;
  // Transport endpoints
  srtPrimaryHost: string;
  srtPrimaryPort: string;
  srtPrimaryMode: string;
  srtPrimaryPassphrase: string;
  mpegPrimaryMulticast: string;
  mpegPrimaryPort: string;
  srtBackupHost: string;
  srtBackupPort: string;
  srtBackupMode: string;
  srtBackupPassphrase: string;
  mpegBackupMulticast: string;
  mpegBackupPort: string;
  // Template
  saveAsTemplate: boolean;
  templateName: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BinderFormData) => void;
  onDelete?: () => void;
  initial?: Partial<BinderFormData>;
  mode: "create" | "edit";
  oldIsoCount?: number;
}

function SectionHeader({ label, variant = "default" }: { label: string; variant?: "required" | "default" }) {
  return (
    <div className="space-y-1 pt-2">
      <span className={cn(
        "text-[9px] tracking-[0.2em] uppercase font-medium",
        variant === "required" ? "text-crimson" : "text-muted-foreground"
      )}>{label}</span>
      <div className={cn("h-px", variant === "required" ? "bg-crimson/20" : "bg-border")} />
    </div>
  );
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">
        {label}{required && <span className="text-crimson ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full text-sm bg-secondary border border-border rounded-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors";
const selectClass = "w-full text-sm bg-secondary border border-border rounded-sm px-3 py-2 text-foreground focus:outline-none focus:border-crimson transition-colors appearance-none";

const DEFAULT_FORM: BinderFormData = {
  title: "", league: "NHL", containerId: "",
  gameType: "Regular Season", season: "2025–26",
  eventDate: new Date().toISOString().split("T")[0],
  eventTime: "19:00", timezone: "America/New_York",
  venue: "", homeTeam: "", awayTeam: "",
  siteType: "Arena", studioLocation: "",
  showType: "Standard", customShowType: "",
  partner: "ESPN", status: "draft",
  isoCount: 12, returnRequired: false,
  commercials: "local-insert", customCommercials: "",
  primaryTransport: "SRT", customPrimaryTransport: "",
  backupTransport: "MPEG-TS", customBackupTransport: "",
  notes: "",
  signalNamingMode: "iso", canonicalSignals: [], customSignalNames: "",
  encoderInputsPerUnit: 2, encoderCount: 6, decoderOutputsPerUnit: 4, decoderCount: 6,
  autoAllocate: true,
  srtPrimaryHost: "", srtPrimaryPort: "", srtPrimaryMode: "caller", srtPrimaryPassphrase: "",
  mpegPrimaryMulticast: "", mpegPrimaryPort: "",
  srtBackupHost: "", srtBackupPort: "", srtBackupMode: "caller", srtBackupPassphrase: "",
  mpegBackupMulticast: "", mpegBackupPort: "",
  saveAsTemplate: false, templateName: "",
};

export function BinderFormModal({ open, onClose, onSubmit, onDelete, initial, mode, oldIsoCount }: Props) {
  const [form, setForm] = useState<BinderFormData>(DEFAULT_FORM);
  const [customIso, setCustomIso] = useState(false);
  const [showIsoWarning, setShowIsoWarning] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [advancedTransportOpen, setAdvancedTransportOpen] = useState(false);
  const [showPassphrasePrimary, setShowPassphrasePrimary] = useState(false);
  const [showPassphraseBackup, setShowPassphraseBackup] = useState(false);

  const userTemplates = templateStore.getAll();

  useEffect(() => {
    if (open) {
      const merged = { ...DEFAULT_FORM, ...initial };
      setForm(merged);
      setCustomIso(!ISO_PRESETS.includes(merged.isoCount));
      setShowIsoWarning(false);
      setDeleteConfirm(false);
      setAdvancedTransportOpen(false);
    }
  }, [open]);

  const set = <K extends keyof BinderFormData>(key: K, value: BinderFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyTemplate = (defaults: Partial<BinderFormData>) => {
    setForm((prev) => ({ ...prev, ...defaults }));
    if (defaults.isoCount && !ISO_PRESETS.includes(defaults.isoCount)) {
      setCustomIso(true);
    } else {
      setCustomIso(false);
    }
    setTemplateOpen(false);
  };

  const handleIsoChange = (val: number) => {
    if (mode === "edit" && oldIsoCount && val < oldIsoCount) {
      setShowIsoWarning(true);
    } else {
      setShowIsoWarning(false);
    }
    set("isoCount", val);
  };

  const toggleCanonical = (name: string) => {
    setForm((prev) => {
      const has = prev.canonicalSignals.includes(name);
      return {
        ...prev,
        canonicalSignals: has
          ? prev.canonicalSignals.filter((n) => n !== name)
          : [...prev.canonicalSignals, name],
      };
    });
  };

  const resolvePartner = (): string => {
    if (form.partner === "Other") return form.notes; // fallback
    return form.partner;
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.venue.trim()) return;

    // Save as template if checked
    if (form.saveAsTemplate && form.templateName.trim()) {
      templateStore.create(form.templateName.trim(), {
        league: "NHL",
        showType: form.showType,
        gameType: form.gameType,
        season: form.season,
        customShowType: form.customShowType,
        siteType: form.siteType,
        partner: form.partner,
        isoCount: form.isoCount,
        returnRequired: form.returnRequired,
        commercials: form.commercials,
        customCommercials: form.customCommercials,
        primaryTransport: form.primaryTransport,
        customPrimaryTransport: form.customPrimaryTransport,
        backupTransport: form.backupTransport,
        customBackupTransport: form.customBackupTransport,
        signalNamingMode: form.signalNamingMode,
        canonicalSignals: form.canonicalSignals,
        customSignalNames: form.customSignalNames,
        encoderInputsPerUnit: form.encoderInputsPerUnit,
        encoderCount: form.encoderCount,
        decoderOutputsPerUnit: form.decoderOutputsPerUnit,
        decoderCount: form.decoderCount,
        autoAllocate: form.autoAllocate,
        timezone: form.timezone,
      });
    }

    onSubmit(form);
    onClose();
  };

  // Auto-generate event title suggestion
  const suggestedTitle = form.awayTeam && form.homeTeam
    ? `${form.awayTeam} @ ${form.homeTeam} — ${form.showType === "Other" ? form.customShowType || "Production" : form.showType}`
    : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="steel-panel w-full max-w-2xl mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
              <h2 className="text-sm font-medium text-foreground">
                  {mode === "create" ? "New Production Binder" : "Edit Production Binder"}
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {mode === "create" ? "Configure a new NHL production binder" : "Update production configuration"}
                </p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* ═══ TEMPLATE ═══ */}
              {mode === "create" && (
                <div className="relative">
                  <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Template</label>
                  <button
                    onClick={() => setTemplateOpen(!templateOpen)}
                    className={cn(inputClass, "text-left flex items-center justify-between")}
                  >
                    <span className="text-muted-foreground">Select a template to pre-fill…</span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", templateOpen && "rotate-180")} />
                  </button>
                  {templateOpen && (
                    <div className="absolute left-0 right-0 mt-1 z-[60] bg-card border border-border rounded-sm shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                      {BUILTIN_TEMPLATES.map((t) => (
                        <button key={t.name} onClick={() => applyTemplate(t.defaults)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary/70 transition-colors border-b border-border last:border-0">
                          <span className="text-sm text-foreground font-medium block">{t.name}</span>
                          <span className="text-[10px] text-muted-foreground">{t.description}</span>
                        </button>
                      ))}
                      {userTemplates.length > 0 && (
                        <>
                          <div className="px-4 py-2 border-t border-border">
                            <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Saved Templates</span>
                          </div>
                          {userTemplates.map((t) => (
                            <button key={t.id} onClick={() => applyTemplate(t.config as Partial<BinderFormData>)}
                              className="w-full text-left px-4 py-3 hover:bg-secondary/70 transition-colors border-b border-border last:border-0">
                              <span className="text-sm text-foreground font-medium block">{t.name}</span>
                              <span className="text-[10px] text-muted-foreground">Saved {format(new Date(t.createdAt), "MMM d, yyyy")}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ GAME CONTEXT (NHL) ═══ */}
              <SectionHeader label="Game Context (NHL)" variant="required" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Away Team" required>
                  <select value={form.awayTeam} onChange={(e) => set("awayTeam", e.target.value)} className={selectClass}>
                    <option value="">Select team…</option>
                    {NHL_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>

                <FormField label="Home Team" required>
                  <select value={form.homeTeam} onChange={(e) => set("homeTeam", e.target.value)} className={selectClass}>
                    <option value="">Select team…</option>
                    {NHL_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>

                <FormField label="Game Type" required>
                  <select value={form.gameType} onChange={(e) => set("gameType", e.target.value)} className={selectClass}>
                    {GAME_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </FormField>

                <FormField label="Season">
                  <select value={form.season} onChange={(e) => set("season", e.target.value)} className={selectClass}>
                    {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>

                <FormField label="Game Date" required>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <button className={cn(inputClass, "text-left")}>
                        {form.eventDate ? format(new Date(form.eventDate + "T12:00:00"), "EEE, MMM d, yyyy") : "Pick a date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[70]" align="start">
                      <Calendar mode="single"
                        selected={form.eventDate ? new Date(form.eventDate + "T12:00:00") : undefined}
                        onSelect={(d) => { if (d) { set("eventDate", format(d, "yyyy-MM-dd")); setDateOpen(false); } }}
                        className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </FormField>

                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Game Time" required>
                    <input type="time" value={form.eventTime} onChange={(e) => set("eventTime", e.target.value)} className={cn(inputClass, "font-mono")} />
                  </FormField>
                  <FormField label="Timezone" required>
                    <select value={form.timezone} onChange={(e) => set("timezone", e.target.value)} className={selectClass}>
                      {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                  </FormField>
                </div>

                <FormField label="Venue" required>
                  <input type="text" value={form.venue} onChange={(e) => set("venue", e.target.value)}
                    placeholder="e.g. Madison Square Garden" className={inputClass} />
                </FormField>

                <FormField label="Site Type">
                  <select value={form.siteType} onChange={(e) => set("siteType", e.target.value)} className={selectClass}>
                    {SITE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>

                {form.siteType === "Hybrid" && (
                  <FormField label="Studio Location">
                    <input type="text" value={form.studioLocation} onChange={(e) => set("studioLocation", e.target.value)}
                      placeholder="e.g. ESPN Bristol" className={inputClass} />
                  </FormField>
                )}

                <FormField label="Production Title" required>
                  <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. NYR @ BOS — Standard" className={inputClass} />
                  {suggestedTitle && !form.title && (
                    <button onClick={() => set("title", suggestedTitle)}
                      className="text-[10px] text-crimson hover:text-foreground mt-1 transition-colors">
                      Use: {suggestedTitle}
                    </button>
                  )}
                </FormField>
              </div>

              {/* ═══ BROADCAST CONFIGURATION ═══ */}
              <SectionHeader label="Broadcast Configuration" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Show Type">
                  <select value={SHOW_TYPES.includes(form.showType) ? form.showType : "Other"}
                    onChange={(e) => set("showType", e.target.value)} className={selectClass}>
                    {SHOW_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {(form.showType === "Other" || !SHOW_TYPES.includes(form.showType)) && (
                    <input type="text" value={form.customShowType} onChange={(e) => set("customShowType", e.target.value)}
                      placeholder="Custom show type" className={cn(inputClass, "mt-2")} />
                  )}
                </FormField>

                <FormField label="Partner">
                  <div className="relative">
                    <input type="text" list="partner-list" value={form.partner}
                      onChange={(e) => set("partner", e.target.value)}
                      placeholder="Select or type partner name" className={inputClass} />
                    <datalist id="partner-list">
                      {PARTNERS.filter((p) => p !== "Other").map((p) => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                </FormField>

                <FormField label="Status">
                  <select value={form.status} onChange={(e) => set("status", e.target.value as BinderStatus)} className={selectClass}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </FormField>

                <FormField label="ISO Count">
                  {!customIso ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {ISO_PRESETS.map((n) => (
                        <button key={n} onClick={() => handleIsoChange(n)}
                          className={cn("px-3 py-1.5 text-sm rounded-sm border transition-colors font-mono",
                            form.isoCount === n ? "border-crimson bg-crimson/10 text-crimson"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20")}>
                          {n}
                        </button>
                      ))}
                      <button onClick={() => setCustomIso(true)}
                        className="px-3 py-1.5 text-sm rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                        Custom
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} max={28} value={form.isoCount}
                        onChange={(e) => handleIsoChange(Math.max(1, Math.min(28, parseInt(e.target.value) || 1)))}
                        className={cn(inputClass, "w-24 font-mono")} />
                      <button onClick={() => { setCustomIso(false); handleIsoChange(12); }}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Presets</button>
                    </div>
                  )}
                  {showIsoWarning && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      Reducing ISO count will remove signal rows {form.isoCount + 1}–{oldIsoCount}
                    </div>
                  )}
                </FormField>

                <FormField label="Return Feed">
                  <button onClick={() => set("returnRequired", !form.returnRequired)}
                    className={cn("text-sm px-3 py-2 rounded-sm border transition-colors",
                      form.returnRequired ? "border-crimson/40 bg-crimson/10 text-crimson"
                        : "border-border bg-secondary text-muted-foreground")}>
                    {form.returnRequired ? "Required" : "Not Required"}
                  </button>
                </FormField>

                <FormField label="Commercial Behavior">
                  <select value={COMMERCIALS_OPTIONS.includes(form.commercials) ? form.commercials : "Other"}
                    onChange={(e) => set("commercials", e.target.value)} className={selectClass}>
                    {COMMERCIALS_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c === "local-insert" ? "Local Insert" : c === "pass-through" ? "Pass-through" : c === "none" ? "None" : "Other"}
                      </option>
                    ))}
                  </select>
                  {(form.commercials === "Other" || !COMMERCIALS_OPTIONS.filter(o => o !== "Other").includes(form.commercials)) && (
                    <input type="text" value={form.customCommercials} onChange={(e) => set("customCommercials", e.target.value)}
                      placeholder="Custom commercial behavior" className={cn(inputClass, "mt-2")} />
                  )}
                </FormField>
              </div>

              {/* ═══ SIGNAL PRESET ═══ */}
              <SectionHeader label="Signal Preset" />

              <div className="space-y-4">
                <FormField label="Signal Naming Mode">
                  <select value={form.signalNamingMode} onChange={(e) => set("signalNamingMode", e.target.value)} className={selectClass}>
                    <option value="iso">ISO 1..N (default)</option>
                    <option value="canonical">Canonical List</option>
                    <option value="custom">Custom List</option>
                  </select>
                </FormField>

                {form.signalNamingMode === "canonical" && (
                  <div>
                    <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">
                      Select Signals ({form.canonicalSignals.length} selected)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-secondary/50 rounded-sm border border-border">
                      {CANONICAL_SIGNAL_NAMES.map((name) => (
                        <button key={name} onClick={() => toggleCanonical(name)}
                          className={cn("px-2 py-1 text-[11px] rounded-sm border transition-colors",
                            form.canonicalSignals.includes(name)
                              ? "border-crimson bg-crimson/10 text-crimson"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20")}>
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.signalNamingMode === "custom" && (
                  <FormField label="Signal Names (one per line)">
                    <textarea value={form.customSignalNames} onChange={(e) => set("customSignalNames", e.target.value)}
                      placeholder={"Beauty\nHome Bench\nAway Bench\nSpeedy\nSupra"}
                      rows={5} className={cn(inputClass, "resize-none font-mono text-xs")} />
                  </FormField>
                )}
              </div>

              {/* ═══ TOPOLOGY ═══ */}
              <SectionHeader label="Encoder / Decoder Topology" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FormField label="Inputs / Encoder">
                  <select value={form.encoderInputsPerUnit} onChange={(e) => set("encoderInputsPerUnit", Number(e.target.value))} className={selectClass}>
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                  </select>
                </FormField>
                <FormField label="Encoder Count">
                  <input type="number" min={1} max={24} value={form.encoderCount}
                    onChange={(e) => set("encoderCount", Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                    className={cn(inputClass, "font-mono")} />
                </FormField>
                <FormField label="Outputs / Decoder">
                  <select value={form.decoderOutputsPerUnit} onChange={(e) => set("decoderOutputsPerUnit", Number(e.target.value))} className={selectClass}>
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                  </select>
                </FormField>
                <FormField label="Decoder Count">
                  <input type="number" min={1} max={24} value={form.decoderCount}
                    onChange={(e) => set("decoderCount", Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                    className={cn(inputClass, "font-mono")} />
                </FormField>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-wider uppercase text-muted-foreground">
                  Capacity: {form.encoderInputsPerUnit * form.encoderCount} encoder inputs · {form.decoderOutputsPerUnit * form.decoderCount} decoder outputs
                </span>
                {form.encoderInputsPerUnit * form.encoderCount < form.isoCount && (
                  <span className="text-[10px] text-crimson flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Encoder shortfall
                  </span>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.autoAllocate} onChange={(e) => set("autoAllocate", e.target.checked)}
                  className="accent-[hsl(var(--crimson))] w-3.5 h-3.5" />
                <span className="text-xs text-muted-foreground">Auto-allocate patchpoints on create</span>
              </label>

              {/* ═══ TRANSPORT ═══ */}
              <SectionHeader label="Transport" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Primary Transport">
                  <select value={TRANSPORTS.includes(form.primaryTransport) ? form.primaryTransport : "Other"}
                    onChange={(e) => set("primaryTransport", e.target.value)} className={selectClass}>
                    {TRANSPORTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {(form.primaryTransport === "Other" || !TRANSPORTS.includes(form.primaryTransport)) && (
                    <input type="text" value={form.customPrimaryTransport} onChange={(e) => set("customPrimaryTransport", e.target.value)}
                      placeholder="Custom transport protocol" className={cn(inputClass, "mt-2")} />
                  )}
                </FormField>

                <FormField label="Backup Transport">
                  <select value={TRANSPORTS.includes(form.backupTransport) ? form.backupTransport : "Other"}
                    onChange={(e) => set("backupTransport", e.target.value)} className={selectClass}>
                    {TRANSPORTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {(form.backupTransport === "Other" || !TRANSPORTS.includes(form.backupTransport)) && (
                    <input type="text" value={form.customBackupTransport} onChange={(e) => set("customBackupTransport", e.target.value)}
                      placeholder="Custom transport protocol" className={cn(inputClass, "mt-2")} />
                  )}
                </FormField>
              </div>

              {/* Advanced Transport Endpoints */}
              <button onClick={() => setAdvancedTransportOpen(!advancedTransportOpen)}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className={cn("w-3 h-3 transition-transform", advancedTransportOpen && "rotate-90")} />
                Transport Endpoints (Advanced)
              </button>

              {advancedTransportOpen && (
                <div className="space-y-4 pl-4 border-l-2 border-border">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Primary Endpoints</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="SRT Host / IP">
                      <input type="text" value={form.srtPrimaryHost} onChange={(e) => set("srtPrimaryHost", e.target.value)}
                        placeholder="e.g. srt-ingest.example.com" className={inputClass} />
                    </FormField>
                    <FormField label="SRT Port">
                      <input type="text" value={form.srtPrimaryPort} onChange={(e) => set("srtPrimaryPort", e.target.value)}
                        placeholder="9000" className={cn(inputClass, "font-mono")} />
                    </FormField>
                    <FormField label="SRT Mode">
                      <select value={form.srtPrimaryMode} onChange={(e) => set("srtPrimaryMode", e.target.value)} className={selectClass}>
                        <option value="caller">Caller</option>
                        <option value="listener">Listener</option>
                        <option value="rendezvous">Rendezvous</option>
                      </select>
                    </FormField>
                    <FormField label="SRT Passphrase">
                      <div className="relative">
                        <input type={showPassphrasePrimary ? "text" : "password"} value={form.srtPrimaryPassphrase}
                          onChange={(e) => set("srtPrimaryPassphrase", e.target.value)}
                          placeholder="Optional" className={cn(inputClass, "pr-8 font-mono")} />
                        <button onClick={() => setShowPassphrasePrimary(!showPassphrasePrimary)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassphrasePrimary ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </FormField>
                    <FormField label="MPEG-TS Multicast">
                      <input type="text" value={form.mpegPrimaryMulticast} onChange={(e) => set("mpegPrimaryMulticast", e.target.value)}
                        placeholder="e.g. 239.1.1.1" className={cn(inputClass, "font-mono")} />
                    </FormField>
                    <FormField label="MPEG-TS Port">
                      <input type="text" value={form.mpegPrimaryPort} onChange={(e) => set("mpegPrimaryPort", e.target.value)}
                        placeholder="5000" className={cn(inputClass, "font-mono")} />
                    </FormField>
                  </div>

                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Backup Endpoints</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="SRT Host / IP">
                      <input type="text" value={form.srtBackupHost} onChange={(e) => set("srtBackupHost", e.target.value)}
                        placeholder="e.g. srt-backup.example.com" className={inputClass} />
                    </FormField>
                    <FormField label="SRT Port">
                      <input type="text" value={form.srtBackupPort} onChange={(e) => set("srtBackupPort", e.target.value)}
                        placeholder="9001" className={cn(inputClass, "font-mono")} />
                    </FormField>
                    <FormField label="SRT Mode">
                      <select value={form.srtBackupMode} onChange={(e) => set("srtBackupMode", e.target.value)} className={selectClass}>
                        <option value="caller">Caller</option>
                        <option value="listener">Listener</option>
                        <option value="rendezvous">Rendezvous</option>
                      </select>
                    </FormField>
                    <FormField label="SRT Passphrase">
                      <div className="relative">
                        <input type={showPassphraseBackup ? "text" : "password"} value={form.srtBackupPassphrase}
                          onChange={(e) => set("srtBackupPassphrase", e.target.value)}
                          placeholder="Optional" className={cn(inputClass, "pr-8 font-mono")} />
                        <button onClick={() => setShowPassphraseBackup(!showPassphraseBackup)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassphraseBackup ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </FormField>
                    <FormField label="MPEG-TS Multicast">
                      <input type="text" value={form.mpegBackupMulticast} onChange={(e) => set("mpegBackupMulticast", e.target.value)}
                        placeholder="e.g. 239.1.1.2" className={cn(inputClass, "font-mono")} />
                    </FormField>
                    <FormField label="MPEG-TS Port">
                      <input type="text" value={form.mpegBackupPort} onChange={(e) => set("mpegBackupPort", e.target.value)}
                        placeholder="5001" className={cn(inputClass, "font-mono")} />
                    </FormField>
                  </div>
                </div>
              )}

              {/* ═══ NOTES ═══ */}
              <FormField label="Notes">
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  placeholder="Additional notes…" rows={3} className={cn(inputClass, "resize-none")} />
              </FormField>

              {/* ═══ SAVE AS TEMPLATE ═══ */}
              {mode === "create" && (
                <div className="pt-2 border-t border-border space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.saveAsTemplate} onChange={(e) => set("saveAsTemplate", e.target.checked)}
                      className="accent-[hsl(var(--crimson))] w-3.5 h-3.5" />
                    <span className="text-xs text-muted-foreground">Save as template</span>
                  </label>
                  {form.saveAsTemplate && (
                    <FormField label="Template Name">
                      <input type="text" value={form.templateName} onChange={(e) => set("templateName", e.target.value)}
                        placeholder="e.g. NBA Standard 18-ISO" className={inputClass} />
                    </FormField>
                  )}
                </div>
              )}

              {/* ═══ DELETE (edit mode) ═══ */}
              {mode === "edit" && onDelete && (
                <div className="pt-4 border-t border-border">
                  {!deleteConfirm ? (
                    <button onClick={() => setDeleteConfirm(true)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete this binder
                    </button>
                  ) : (
                    <div className="steel-panel p-4 border-destructive/30">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Confirm Deletion</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-4">
                        This will permanently delete this binder, all signal configurations, assets, and checklist data. This action cannot be undone.
                      </p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { onDelete(); onClose(); }}
                          className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-sm hover:bg-destructive/90 transition-colors">
                          Delete Permanently
                        </button>
                        <button onClick={() => setDeleteConfirm(false)}
                          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button onClick={handleSubmit}
                disabled={!form.title.trim() || !form.venue.trim()}
                className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {mode === "create" ? "Create Production" : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
