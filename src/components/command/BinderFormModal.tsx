import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2, ChevronDown, ChevronRight, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BinderStatus, ReturnFeedEndpoint, DeviceLine, LQPort } from "@/stores/binder-store";
import { templateStore } from "@/stores/template-store";
import { staffStore } from "@/stores/staff-store";
import { CANONICAL_SIGNAL_NAMES } from "@/data/mock-signals";

const NHL_TEAMS = [
  "ANA","ARI","BOS","BUF","CGY","CAR","CHI","COL","CBJ","DAL",
  "DET","EDM","FLA","LAK","MIN","MTL","NSH","NJD","NYI","NYR",
  "OTT","PHI","PIT","SJS","SEA","STL","TBL","TOR","VAN","VGK","WPG","WSH",
];
const PARTNERS = ["ESPN", "SportsNet CA", "WBD", "Fanatics", "Amazon", "Altitude"];
const STATUSES: BinderStatus[] = ["draft", "active", "completed", "archived"];
const ISO_PRESETS = [8, 12, 16, 18, 24];
const TIMEZONES = [
  { value: "America/New_York", label: "ET (Eastern)" },
  { value: "America/Chicago", label: "CT (Central)" },
  { value: "America/Denver", label: "MT (Mountain)" },
  { value: "America/Los_Angeles", label: "PT (Pacific)" },
];
const ENCODER_BRANDS = ["Videon", "Matrox", "Haivision", "Other"];
const DECODER_BRANDS = ["Haivision", "Magwell", "Sencore", "Other"];

function defaultEncOutputs(brand: string) {
  switch (brand) { case "Videon": return 4; case "Matrox": return 2; case "Haivision": return 2; default: return 2; }
}
function defaultDecOutputs(brand: string) {
  switch (brand) { case "Haivision": return 2; case "Magwell": return 1; case "Sencore": return 4; default: return 2; }
}

export interface BinderFormData {
  title: string;
  eventDate: string;
  eventTime: string;
  timezone: string;
  rehearsalDate: string;
  awayTeam: string;
  homeTeam: string;
  venue: string;
  broadcastFeed: string;
  controlRoom: string;
  onsiteTechManager: string;
  partner: string;
  status: BinderStatus;
  isoCount: number;
  returnRequired: boolean;
  returnFeedEndpoints: ReturnFeedEndpoint[];
  signalNamingMode: string;
  canonicalSignals: string[];
  customSignalNames: string;
  encoders: DeviceLine[];
  decoders: DeviceLine[];
  primaryTransport: string;
  outboundHost: string;
  outboundPort: string;
  inboundHost: string;
  inboundPort: string;
  backupTransport: string;
  backupOutboundHost: string;
  backupOutboundPort: string;
  backupInboundHost: string;
  backupInboundPort: string;
  notes: string;
  saveAsTemplate: boolean;
  templateName: string;
  // Backward compat (hidden from form, computed or defaulted)
  league: string;
  containerId: string;
  showType: string;
  customShowType: string;
  siteType: string;
  studioLocation: string;
  commercials: string;
  customCommercials: string;
  customPrimaryTransport: string;
  customBackupTransport: string;
  gameType: string;
  season: string;
  encoderInputsPerUnit: number;
  encoderCount: number;
  decoderOutputsPerUnit: number;
  decoderCount: number;
  autoAllocate: boolean;
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
  // LQ Ports
  lqRequired: boolean;
  lqPorts: LQPort[];
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
      <span className={cn("text-[9px] tracking-[0.2em] uppercase font-medium", variant === "required" ? "text-crimson" : "text-muted-foreground")}>{label}</span>
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
  title: "", eventDate: new Date().toISOString().split("T")[0],
  eventTime: "19:00", timezone: "America/New_York", rehearsalDate: "",
  awayTeam: "", homeTeam: "", venue: "", broadcastFeed: "",
  controlRoom: "23", onsiteTechManager: "",
  partner: "ESPN", status: "draft", isoCount: 12,
  returnRequired: false, returnFeedEndpoints: [],
  signalNamingMode: "iso", canonicalSignals: [], customSignalNames: "",
  encoders: [{ id: "enc-1", brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 2, notes: "" }],
  decoders: [{ id: "dec-1", brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 6, notes: "" }],
  primaryTransport: "SRT", outboundHost: "", outboundPort: "",
  inboundHost: "", inboundPort: "",
  backupTransport: "", backupOutboundHost: "", backupOutboundPort: "",
  backupInboundHost: "", backupInboundPort: "",
  notes: "", saveAsTemplate: false, templateName: "",
  // Backward compat defaults
  league: "NHL", containerId: "", showType: "Standard", customShowType: "",
  siteType: "Arena", studioLocation: "", commercials: "local-insert",
  customCommercials: "", customPrimaryTransport: "", customBackupTransport: "",
  gameType: "Regular Season", season: "2025–26",
  encoderInputsPerUnit: 2, encoderCount: 6, decoderOutputsPerUnit: 4, decoderCount: 6,
  autoAllocate: true,
  srtPrimaryHost: "", srtPrimaryPort: "", srtPrimaryMode: "caller", srtPrimaryPassphrase: "",
  mpegPrimaryMulticast: "", mpegPrimaryPort: "",
  srtBackupHost: "", srtBackupPort: "", srtBackupMode: "caller", srtBackupPassphrase: "",
  mpegBackupMulticast: "", mpegBackupPort: "",
  lqRequired: false,
  lqPorts: [
    { letter: "E", label: "Truck AD", notes: "" },
    { letter: "F", label: "Truck Production", notes: "" },
    { letter: "G", label: "Cam Ops", notes: "" },
    { letter: "H", label: "TBD", notes: "" },
  ],
};

export function BinderFormModal({ open, onClose, onSubmit, onDelete, initial, mode, oldIsoCount }: Props) {
  const [form, setForm] = useState<BinderFormData>(DEFAULT_FORM);
  const [customIso, setCustomIso] = useState(false);
  const [showIsoWarning, setShowIsoWarning] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [rehearsalDateOpen, setRehearsalDateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [partnerOther, setPartnerOther] = useState(false);

  const userTemplates = templateStore.getAll();
  const allStaff = staffStore.getAll();

  useEffect(() => {
    if (open) {
      const merged = { ...DEFAULT_FORM, ...initial };
      setForm(merged);
      setCustomIso(!ISO_PRESETS.includes(merged.isoCount));
      setShowIsoWarning(false);
      setDeleteConfirm(false);
      setBackupOpen(!!merged.backupTransport);
      setPartnerOther(!PARTNERS.includes(merged.partner) && merged.partner !== "");
    }
  }, [open]);

  const set = <K extends keyof BinderFormData>(key: K, value: BinderFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleIsoChange = (val: number) => {
    if (mode === "edit" && oldIsoCount && val < oldIsoCount) setShowIsoWarning(true);
    else setShowIsoWarning(false);
    set("isoCount", val);
  };

  const toggleCanonical = (name: string) => {
    setForm((prev) => ({
      ...prev,
      canonicalSignals: prev.canonicalSignals.includes(name)
        ? prev.canonicalSignals.filter((n) => n !== name)
        : [...prev.canonicalSignals, name],
    }));
  };

  // Device line helpers
  const addEncoder = () => setForm((p) => ({ ...p, encoders: [...p.encoders, { id: `enc-${Date.now()}`, brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 1, notes: "" }] }));
  const removeEncoder = (idx: number) => setForm((p) => ({ ...p, encoders: p.encoders.filter((_, i) => i !== idx) }));
  const updateEncoder = (idx: number, patch: Partial<DeviceLine>) => setForm((p) => ({ ...p, encoders: p.encoders.map((e, i) => i === idx ? { ...e, ...patch } : e) }));
  const addDecoder = () => setForm((p) => ({ ...p, decoders: [...p.decoders, { id: `dec-${Date.now()}`, brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 1, notes: "" }] }));
  const removeDecoder = (idx: number) => setForm((p) => ({ ...p, decoders: p.decoders.filter((_, i) => i !== idx) }));
  const updateDecoder = (idx: number, patch: Partial<DeviceLine>) => setForm((p) => ({ ...p, decoders: p.decoders.map((d, i) => i === idx ? { ...d, ...patch } : d) }));

  // Return feed endpoint helpers
  const addEndpoint = () => setForm((p) => ({ ...p, returnFeedEndpoints: [...p.returnFeedEndpoints, { id: `rfp-${Date.now()}`, sourcePartner: "", type: "SRT", host: "", port: "", mode: "caller", notes: "" }] }));
  const removeEndpoint = (idx: number) => setForm((p) => ({ ...p, returnFeedEndpoints: p.returnFeedEndpoints.filter((_, i) => i !== idx) }));
  const updateEndpoint = (idx: number, patch: Partial<ReturnFeedEndpoint>) => setForm((p) => ({ ...p, returnFeedEndpoints: p.returnFeedEndpoints.map((ep, i) => i === idx ? { ...ep, ...patch } : ep) }));

  const totalEncOutputs = form.encoders.reduce((sum, e) => sum + e.outputsPerUnit * e.unitCount, 0);
  const totalDecOutputs = form.decoders.reduce((sum, d) => sum + d.outputsPerUnit * d.unitCount, 0);

  const suggestedTitle = form.awayTeam && form.homeTeam ? `${form.awayTeam} @ ${form.homeTeam}` : "";

  const handleSubmit = () => {
    if (!form.title.trim() || !form.venue.trim()) return;
    // Compute backward compat fields from device lines
    const computed = { ...form };
    computed.encoderCount = form.encoders.reduce((sum, e) => sum + e.unitCount, 0);
    computed.encoderInputsPerUnit = form.encoders.length > 0 ? form.encoders[0].outputsPerUnit : 2;
    computed.decoderCount = form.decoders.reduce((sum, d) => sum + d.unitCount, 0);
    computed.decoderOutputsPerUnit = form.decoders.length > 0 ? form.decoders[0].outputsPerUnit : 4;
    computed.srtPrimaryHost = form.outboundHost;
    computed.srtPrimaryPort = form.outboundPort;
    computed.srtBackupHost = form.backupOutboundHost;
    computed.srtBackupPort = form.backupOutboundPort;
    computed.autoAllocate = true;

    if (form.saveAsTemplate && form.templateName.trim()) {
      templateStore.create(form.templateName.trim(), {
        partner: form.partner,
        isoCount: form.isoCount,
        returnRequired: form.returnRequired,
        primaryTransport: form.primaryTransport,
        backupTransport: form.backupTransport,
        signalNamingMode: form.signalNamingMode,
        canonicalSignals: form.canonicalSignals,
        customSignalNames: form.customSignalNames,
        timezone: form.timezone,
      });
    }
    onSubmit(computed);
    onClose();
  };

  const applyTemplate = (config: Partial<BinderFormData>) => {
    setForm((prev) => ({ ...prev, ...config }));
    setTemplateOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }} transition={{ duration: 0.3 }}
            className="steel-panel w-full max-w-2xl mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-medium text-foreground">{mode === "create" ? "New Binder" : "Edit Binder"}</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">{mode === "create" ? "Configure a new NHL production binder" : "Update production configuration"}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* ═══ TEMPLATE ═══ */}
              {mode === "create" && userTemplates.length > 0 && (
                <div className="relative">
                  <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Template</label>
                  <button onClick={() => setTemplateOpen(!templateOpen)} className={cn(inputClass, "text-left flex items-center justify-between")}>
                    <span className="text-muted-foreground">Select a saved template…</span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", templateOpen && "rotate-180")} />
                  </button>
                  {templateOpen && (
                    <div className="absolute left-0 right-0 mt-1 z-[60] bg-card border border-border rounded-sm shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                      {userTemplates.map((t) => (
                        <button key={t.id} onClick={() => applyTemplate(t.config as Partial<BinderFormData>)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary/70 transition-colors border-b border-border last:border-0">
                          <span className="text-sm text-foreground font-medium block">{t.name}</span>
                          <span className="text-[10px] text-muted-foreground">Saved {format(new Date(t.createdAt), "MMM d, yyyy")}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ A) IDENTITY + GAME CONTEXT ═══ */}
              <SectionHeader label="Identity + Game Context" variant="required" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Away Team" required>
                  <select value={form.awayTeam} onChange={(e) => set("awayTeam", e.target.value)} className={selectClass}>
                    <option value="">Select…</option>
                    {NHL_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Home Team" required>
                  <select value={form.homeTeam} onChange={(e) => set("homeTeam", e.target.value)} className={selectClass}>
                    <option value="">Select…</option>
                    {NHL_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Binder Title" required>
                  <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. NYR @ BOS" className={inputClass} />
                  {suggestedTitle && !form.title && (
                    <button onClick={() => set("title", suggestedTitle)}
                      className="text-[10px] text-crimson hover:text-foreground mt-1 transition-colors">Use: {suggestedTitle}</button>
                  )}
                </FormField>
                <FormField label="Status">
                  <select value={form.status} onChange={(e) => set("status", e.target.value as BinderStatus)} className={selectClass}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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
                      <Calendar mode="single" selected={form.eventDate ? new Date(form.eventDate + "T12:00:00") : undefined}
                        onSelect={(d) => { if (d) { set("eventDate", format(d, "yyyy-MM-dd")); setDateOpen(false); } }}
                        className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </FormField>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Game Time" required>
                    <input type="time" value={form.eventTime} onChange={(e) => set("eventTime", e.target.value)} className={cn(inputClass, "font-mono")} />
                  </FormField>
                  <FormField label="Timezone">
                    <select value={form.timezone} onChange={(e) => set("timezone", e.target.value)} className={selectClass}>
                      {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                  </FormField>
                </div>
                <FormField label="Rehearsal Date">
                  <Popover open={rehearsalDateOpen} onOpenChange={setRehearsalDateOpen}>
                    <PopoverTrigger asChild>
                      <button className={cn(inputClass, "text-left")}>
                        {form.rehearsalDate ? format(new Date(form.rehearsalDate + "T12:00:00"), "EEE, MMM d, yyyy") : "Optional"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[70]" align="start">
                      <Calendar mode="single" selected={form.rehearsalDate ? new Date(form.rehearsalDate + "T12:00:00") : undefined}
                        onSelect={(d) => { if (d) { set("rehearsalDate", format(d, "yyyy-MM-dd")); setRehearsalDateOpen(false); } }}
                        className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </FormField>
                <FormField label="Arena" required>
                  <input type="text" value={form.venue} onChange={(e) => set("venue", e.target.value)}
                    placeholder="e.g. Madison Square Garden" className={inputClass} />
                </FormField>
                <FormField label="Broadcast Feed to Watch">
                  <input type="text" value={form.broadcastFeed} onChange={(e) => set("broadcastFeed", e.target.value)}
                    placeholder="e.g. ESPN2" className={inputClass} />
                </FormField>
              </div>

              {/* ═══ B) FACILITY ═══ */}
              <SectionHeader label="Facility" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Control Room" required>
                  <div className="flex gap-2">
                    {["23", "26"].map((cr) => (
                      <button key={cr} onClick={() => set("controlRoom", cr)}
                        className={cn("flex-1 px-3 py-2 text-sm rounded-sm border font-mono transition-colors",
                          form.controlRoom === cr ? "border-crimson bg-crimson/10 text-crimson" : "border-border text-muted-foreground hover:text-foreground")}>
                        CR-{cr}
                      </button>
                    ))}
                  </div>
                </FormField>
                <FormField label="Onsite Tech Manager">
                  <input type="text" value={form.onsiteTechManager} onChange={(e) => set("onsiteTechManager", e.target.value)}
                    placeholder="e.g. John Smith" className={inputClass} />
                </FormField>
              </div>

              {/* ═══ C) PARTNER + RETURN FEED ═══ */}
              <SectionHeader label="Partner + Return Feed" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Partner" required>
                  {!partnerOther ? (
                    <div className="space-y-2">
                      <select value={PARTNERS.includes(form.partner) ? form.partner : "__other"}
                        onChange={(e) => { if (e.target.value === "__other") { setPartnerOther(true); set("partner", ""); } else set("partner", e.target.value); }}
                        className={selectClass}>
                        {PARTNERS.map((p) => <option key={p} value={p}>{p}</option>)}
                        <option value="__other">Other…</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={form.partner} onChange={(e) => set("partner", e.target.value)}
                        placeholder="Partner name" className={inputClass} />
                      <button onClick={() => { setPartnerOther(false); set("partner", "ESPN"); }}
                        className="text-[10px] text-muted-foreground hover:text-foreground whitespace-nowrap">List</button>
                    </div>
                  )}
                </FormField>
                <FormField label="Return Feed">
                  <button onClick={() => set("returnRequired", !form.returnRequired)}
                    className={cn("text-sm px-3 py-2 rounded-sm border transition-colors w-full",
                      form.returnRequired ? "border-crimson/40 bg-crimson/10 text-crimson" : "border-border bg-secondary text-muted-foreground")}>
                    {form.returnRequired ? "Required" : "Not Required"}
                  </button>
                </FormField>
              </div>

              {form.returnRequired && (
                <div className="space-y-3 pl-4 border-l-2 border-crimson/20">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Return Feed Endpoints</span>
                  {form.returnFeedEndpoints.map((ep, idx) => (
                    <div key={ep.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-secondary/30 rounded-sm">
                      <FormField label="Source Partner">
                        <input type="text" value={ep.sourcePartner} onChange={(e) => updateEndpoint(idx, { sourcePartner: e.target.value })}
                          placeholder="e.g. SportsNet CA" className={inputClass} />
                      </FormField>
                      <FormField label="Host / IP">
                        <input type="text" value={ep.host} onChange={(e) => updateEndpoint(idx, { host: e.target.value })}
                          placeholder="srt.partner.com" className={cn(inputClass, "font-mono")} />
                      </FormField>
                      <FormField label="Port">
                        <input type="text" value={ep.port} onChange={(e) => updateEndpoint(idx, { port: e.target.value })}
                          placeholder="9000" className={cn(inputClass, "font-mono")} />
                      </FormField>
                      <div className="flex items-end gap-1">
                        <div className="flex-1">
                          <FormField label="Notes">
                            <input type="text" value={ep.notes} onChange={(e) => updateEndpoint(idx, { notes: e.target.value })}
                              placeholder="…" className={inputClass} />
                          </FormField>
                        </div>
                        <button onClick={() => removeEndpoint(idx)} className="p-2 text-muted-foreground hover:text-destructive">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addEndpoint}
                    className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-crimson hover:text-foreground transition-colors">
                    <Plus className="w-3 h-3" /> Add Endpoint
                  </button>
                </div>
              )}

              {/* ═══ D) ISO / SIGNAL NAMING ═══ */}
              <SectionHeader label="Signal Configuration" />
              <FormField label="ISO Count">
                {!customIso ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {ISO_PRESETS.map((n) => (
                      <button key={n} onClick={() => handleIsoChange(n)}
                        className={cn("px-3 py-1.5 text-sm rounded-sm border transition-colors font-mono",
                          form.isoCount === n ? "border-crimson bg-crimson/10 text-crimson" : "border-border text-muted-foreground hover:text-foreground")}>
                        {n}
                      </button>
                    ))}
                    <button onClick={() => setCustomIso(true)}
                      className="px-3 py-1.5 text-sm rounded-sm border border-border text-muted-foreground hover:text-foreground transition-colors">Custom</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={28} value={form.isoCount}
                      onChange={(e) => handleIsoChange(Math.max(1, Math.min(28, parseInt(e.target.value) || 1)))}
                      className={cn(inputClass, "w-24 font-mono")} />
                    <button onClick={() => { setCustomIso(false); handleIsoChange(12); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground">Presets</button>
                  </div>
                )}
                {showIsoWarning && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> Reducing ISO count will remove signal rows {form.isoCount + 1}–{oldIsoCount}
                  </div>
                )}
              </FormField>

              <FormField label="Signal Naming Mode">
                <select value={form.signalNamingMode} onChange={(e) => set("signalNamingMode", e.target.value)} className={selectClass}>
                  <option value="iso">ISO 01..N (default)</option>
                  <option value="canonical">Canonical List</option>
                  <option value="custom">Custom List</option>
                </select>
              </FormField>

              {form.signalNamingMode === "canonical" && (
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">
                    Select Signals ({form.canonicalSignals.length} selected — drag to reorder)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-secondary/50 rounded-sm border border-border">
                    {CANONICAL_SIGNAL_NAMES.map((name) => (
                      <button key={name} onClick={() => toggleCanonical(name)}
                        className={cn("px-2 py-1 text-[11px] rounded-sm border transition-colors",
                          form.canonicalSignals.includes(name) ? "border-crimson bg-crimson/10 text-crimson" : "border-border text-muted-foreground hover:text-foreground")}>
                        {name}
                      </button>
                    ))}
                  </div>
                  {form.canonicalSignals.length > 0 && (
                    <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5">
                      {form.canonicalSignals.map((name, i) => (
                        <div key={name}><span className="font-mono text-crimson">Row {i + 1}</span> → {name}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {form.signalNamingMode === "custom" && (
                <div>
                  <FormField label="Signal Names (one per line, max 48 chars)">
                    <textarea value={form.customSignalNames} onChange={(e) => set("customSignalNames", e.target.value)}
                      placeholder={"Beauty\nHome Bench\nAway Bench\nSpeedy\nSupra"}
                      rows={5} className={cn(inputClass, "resize-none font-mono text-xs")} />
                  </FormField>
                  {form.customSignalNames.trim() && (
                    <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                      {form.customSignalNames.split("\n").filter(Boolean).map((line, i) => (
                        <div key={i}>
                          <span className="font-mono text-crimson">Row {i + 1}</span> → {line.slice(0, 48)}
                          {line.length > 48 && <span className="text-destructive ml-1">(truncated at 48)</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ E) ENCODER / DECODER TOPOLOGY ═══ */}
              <SectionHeader label="Encoder / Decoder Topology" />

              <div className="space-y-3">
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Encoders</span>
                {form.encoders.map((enc, idx) => (
                  <div key={enc.id} className="grid grid-cols-5 gap-2 p-3 bg-secondary/30 rounded-sm">
                    <FormField label="Brand">
                      <select value={enc.brand} onChange={(e) => { const b = e.target.value; updateEncoder(idx, { brand: b, outputsPerUnit: defaultEncOutputs(b) }); }} className={selectClass}>
                        {ENCODER_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Model">
                      <input type="text" value={enc.model} onChange={(e) => updateEncoder(idx, { model: e.target.value })}
                        placeholder="Model" className={inputClass} />
                    </FormField>
                    <FormField label="Out/Unit">
                      <input type="number" min={1} max={16} value={enc.outputsPerUnit}
                        onChange={(e) => updateEncoder(idx, { outputsPerUnit: Math.max(1, parseInt(e.target.value) || 1) })}
                        className={cn(inputClass, "font-mono")} />
                    </FormField>
                    <FormField label="Units">
                      <input type="number" min={1} max={24} value={enc.unitCount}
                        onChange={(e) => updateEncoder(idx, { unitCount: Math.max(1, parseInt(e.target.value) || 1) })}
                        className={cn(inputClass, "font-mono")} />
                    </FormField>
                    <div className="flex items-end">
                      {form.encoders.length > 1 && (
                        <button onClick={() => removeEncoder(idx)} className="p-2 text-muted-foreground hover:text-destructive">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <button onClick={addEncoder}
                    className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-crimson hover:text-foreground transition-colors">
                    <Plus className="w-3 h-3" /> Add Encoder
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground">Total: {totalEncOutputs} encode outputs</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Decoders</span>
                {form.decoders.map((dec, idx) => (
                  <div key={dec.id} className="grid grid-cols-5 gap-2 p-3 bg-secondary/30 rounded-sm">
                    <FormField label="Brand">
                      <select value={dec.brand} onChange={(e) => { const b = e.target.value; updateDecoder(idx, { brand: b, outputsPerUnit: defaultDecOutputs(b) }); }} className={selectClass}>
                        {DECODER_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Model">
                      <input type="text" value={dec.model} onChange={(e) => updateDecoder(idx, { model: e.target.value })}
                        placeholder="Model" className={inputClass} />
                    </FormField>
                    <FormField label="Out/Unit">
                      <input type="number" min={1} max={16} value={dec.outputsPerUnit}
                        onChange={(e) => updateDecoder(idx, { outputsPerUnit: Math.max(1, parseInt(e.target.value) || 1) })}
                        className={cn(inputClass, "font-mono")} />
                    </FormField>
                    <FormField label="Units">
                      <input type="number" min={1} max={24} value={dec.unitCount}
                        onChange={(e) => updateDecoder(idx, { unitCount: Math.max(1, parseInt(e.target.value) || 1) })}
                        className={cn(inputClass, "font-mono")} />
                    </FormField>
                    <div className="flex items-end">
                      {form.decoders.length > 1 && (
                        <button onClick={() => removeDecoder(idx)} className="p-2 text-muted-foreground hover:text-destructive">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <button onClick={addDecoder}
                    className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-crimson hover:text-foreground transition-colors">
                    <Plus className="w-3 h-3" /> Add Decoder
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground">Total: {totalDecOutputs} decoder outputs</span>
                </div>
              </div>

              {/* Capacity warnings */}
              <div className="flex flex-wrap gap-4 text-[10px]">
                <span className="text-muted-foreground">Signals: {form.isoCount} required</span>
                {totalEncOutputs < form.isoCount && (
                  <span className="text-crimson flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Encoder shortfall ({totalEncOutputs} available)</span>
                )}
                {totalDecOutputs < form.isoCount && (
                  <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Decoder shortfall ({totalDecOutputs} available)</span>
                )}
              </div>

              {/* ═══ F) TRANSPORT ═══ */}
              <SectionHeader label="Transport" />
              <FormField label="Primary Transport">
                <select value={form.primaryTransport} onChange={(e) => set("primaryTransport", e.target.value)} className={selectClass}>
                  <option value="SRT">SRT</option>
                  <option value="MPEG-TS">MPEG-TS</option>
                  <option value="Fiber">Fiber</option>
                  <option value="RIST">RIST</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Outbound Host (Arena → Cloud)">
                  <input type="text" value={form.outboundHost} onChange={(e) => set("outboundHost", e.target.value)}
                    placeholder="srt-ingest.nhl.com" className={cn(inputClass, "font-mono")} />
                </FormField>
                <FormField label="Outbound Port">
                  <input type="text" value={form.outboundPort} onChange={(e) => set("outboundPort", e.target.value)}
                    placeholder="9000" className={cn(inputClass, "font-mono")} />
                </FormField>
                <FormField label="Inbound Host (Cloud → HQ)">
                  <input type="text" value={form.inboundHost} onChange={(e) => set("inboundHost", e.target.value)}
                    placeholder="srt-hq.nhl.com" className={cn(inputClass, "font-mono")} />
                </FormField>
                <FormField label="Inbound Port">
                  <input type="text" value={form.inboundPort} onChange={(e) => set("inboundPort", e.target.value)}
                    placeholder="9001" className={cn(inputClass, "font-mono")} />
                </FormField>
              </div>

              {/* Backup transport */}
              <button onClick={() => setBackupOpen(!backupOpen)}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className={cn("w-3 h-3 transition-transform", backupOpen && "rotate-90")} />
                Backup Transport (Optional)
              </button>
              {backupOpen && (
                <div className="space-y-4 pl-4 border-l-2 border-border">
                  <FormField label="Backup Transport">
                    <select value={form.backupTransport} onChange={(e) => set("backupTransport", e.target.value)} className={selectClass}>
                      <option value="">None</option>
                      <option value="SRT">SRT</option>
                      <option value="MPEG-TS">MPEG-TS</option>
                      <option value="Fiber">Fiber</option>
                    </select>
                  </FormField>
                  {form.backupTransport && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Outbound Host">
                        <input type="text" value={form.backupOutboundHost} onChange={(e) => set("backupOutboundHost", e.target.value)} className={cn(inputClass, "font-mono")} placeholder="backup host" />
                      </FormField>
                      <FormField label="Outbound Port">
                        <input type="text" value={form.backupOutboundPort} onChange={(e) => set("backupOutboundPort", e.target.value)} className={cn(inputClass, "font-mono")} placeholder="9002" />
                      </FormField>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ G) LQ PORTS REQUEST ═══ */}
              <SectionHeader label="LQ Ports Request" />
              <FormField label="LQ Required">
                <button onClick={() => set("lqRequired", !form.lqRequired)}
                  className={cn("text-sm px-3 py-2 rounded-sm border transition-colors w-full",
                    form.lqRequired ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground")}>
                  {form.lqRequired ? "Yes — LQ Required" : "No — LQ Not Required"}
                </button>
              </FormField>

              {form.lqRequired && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Port Assignments</span>
                  {form.lqPorts.map((port, idx) => (
                    <div key={port.letter} className="grid grid-cols-[60px_1fr_1fr] gap-2 items-end">
                      <div>
                        <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Port</label>
                        <span className="text-sm font-mono text-foreground block py-2 px-3 bg-secondary/50 border border-border rounded-sm">{port.letter}</span>
                      </div>
                      <FormField label="Audio Label">
                        <input type="text" value={port.label}
                          onChange={(e) => {
                            const updated = [...form.lqPorts];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            set("lqPorts", updated);
                          }}
                          placeholder="e.g. Truck AD" className={inputClass} />
                      </FormField>
                      <FormField label="Notes">
                        <input type="text" value={port.notes}
                          onChange={(e) => {
                            const updated = [...form.lqPorts];
                            updated[idx] = { ...updated[idx], notes: e.target.value };
                            set("lqPorts", updated);
                          }}
                          placeholder="Optional" className={inputClass} />
                      </FormField>
                    </div>
                  ))}
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
                        placeholder="e.g. Standard 18-ISO" className={inputClass} />
                    </FormField>
                  )}
                </div>
              )}

              {/* ═══ DELETE ═══ */}
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
                      <p className="text-[11px] text-muted-foreground mb-4">This will permanently delete this binder and all associated data.</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { onDelete(); onClose(); }}
                          className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-sm hover:bg-destructive/90">Delete</button>
                        <button onClick={() => setDeleteConfirm(false)}
                          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleSubmit}
                disabled={!form.title.trim() || !form.venue.trim()}
                className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">
                {mode === "create" ? "Create Binder" : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
