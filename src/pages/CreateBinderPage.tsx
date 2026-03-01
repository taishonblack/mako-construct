import { useState, useCallback, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Minus, AlertTriangle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BinderHeader, DEFAULT_BINDER_HEADER, type BinderHeaderData } from "@/components/binder/BinderHeader";
import { binderStore, type DeviceLine } from "@/stores/binder-store";
import { generateSignals, generatePatchpoints, CANONICAL_SIGNAL_NAMES } from "@/lib/signal-utils";
import { DEFAULT_TRANSPORT } from "@/lib/binder-types";
import { templateStore } from "@/stores/template-store";
import type { SignalNamingMode } from "@/lib/signal-utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const QuinnBinderAssistant = lazy(() => import("@/components/quinn/QuinnBinderAssistant"));

const ISO_PRESETS = [8, 12, 16, 18, 24];
const ENCODER_BRANDS = ["Videon", "Matrox", "Haivision", "Other"];
const DECODER_BRANDS = ["Haivision", "Magwell", "Sencore", "Other"];

function defaultEncOutputs(brand: string) {
  switch (brand) { case "Videon": return 4; case "Matrox": return 2; case "Haivision": return 2; default: return 2; }
}
function defaultDecOutputs(brand: string) {
  switch (brand) { case "Haivision": return 2; case "Magwell": return 1; case "Sencore": return 4; default: return 2; }
}

const inputClass = "w-full text-sm bg-secondary border border-border rounded-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";
const selectClass = "w-full text-sm bg-secondary border border-border rounded-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none";

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="space-y-1 pt-2">
      <span className="text-[9px] tracking-[0.2em] uppercase font-medium text-primary">{label}</span>
      <div className="h-px bg-primary/20" />
    </div>
  );
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const DEFAULT_CHECKLIST_SEEDS = [
  { label: "Confirm ISO count + signal naming", always: true },
  { label: "Encoder allocation verified", always: true },
  { label: "Decoder allocation verified", always: true },
  { label: "TX/RX naming generated", always: true },
  { label: "Transport endpoints entered/tested", always: true },
  { label: "Return feed request sent", always: false },
  { label: "Routes reviewed", always: true },
  { label: "Pre-air readiness check", always: true },
];

export default function CreateBinderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"form" | "quinn">(() => searchParams.get("mode") === "quinn" ? "quinn" : "form");

  // Header state
  const [header, setHeader] = useState<BinderHeaderData>({ ...DEFAULT_BINDER_HEADER });

  // Signal config
  const [isoCount, setIsoCount] = useState(12);
  const [customIso, setCustomIso] = useState(false);
  const [signalNamingMode, setSignalNamingMode] = useState("iso");
  const [canonicalSignals, setCanonicalSignals] = useState<string[]>([]);
  const [customSignalNames, setCustomSignalNames] = useState("");

  // Encoder/Decoder
  const [encoders, setEncoders] = useState<DeviceLine[]>([{ id: "enc-1", brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 2, notes: "" }]);
  const [decoders, setDecoders] = useState<DeviceLine[]>([{ id: "dec-1", brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 6, notes: "" }]);

  // Transport
  const [primaryTransport, setPrimaryTransport] = useState("SRT");
  const [outboundHost, setOutboundHost] = useState("");
  const [outboundPort, setOutboundPort] = useState("");
  const [inboundHost, setInboundHost] = useState("");
  const [inboundPort, setInboundPort] = useState("");
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupTransport, setBackupTransport] = useState("");

  // Notes + template
  const [notes, setNotes] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [seedChecklist, setSeedChecklist] = useState(true);

  const totalEncOutputs = encoders.reduce((sum, e) => sum + e.outputsPerUnit * e.unitCount, 0);
  const totalDecOutputs = decoders.reduce((sum, d) => sum + d.outputsPerUnit * d.unitCount, 0);

  const toggleCanonical = (name: string) => {
    setCanonicalSignals(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const addEncoder = () => setEncoders(p => [...p, { id: `enc-${Date.now()}`, brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 1, notes: "" }]);
  const removeEncoder = (idx: number) => setEncoders(p => p.filter((_, i) => i !== idx));
  const updateEncoder = (idx: number, patch: Partial<DeviceLine>) => setEncoders(p => p.map((e, i) => i === idx ? { ...e, ...patch } : e));
  const addDecoder = () => setDecoders(p => [...p, { id: `dec-${Date.now()}`, brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 1, notes: "" }]);
  const removeDecoder = (idx: number) => setDecoders(p => p.filter((_, i) => i !== idx));
  const updateDecoder = (idx: number, patch: Partial<DeviceLine>) => setDecoders(p => p.map((d, i) => i === idx ? { ...d, ...patch } : d));

  const buildChecklist = useCallback((returnRequired: boolean) => {
    const now = new Date().toISOString();
    if (!seedChecklist) return [];
    return DEFAULT_CHECKLIST_SEEDS
      .filter(s => s.always || (s.label.includes("Return") && returnRequired))
      .map((s, i) => ({ id: `ck-seed-${i}`, label: s.label, checked: false, assignedTo: "", dueAt: "", createdAt: now, status: "open" as const, notes: "" }));
  }, [seedChecklist]);

  const handleCreate = async () => {
    if (!header.title.trim() || !header.venue.trim()) return;

    const computedEncoderCount = encoders.reduce((sum, e) => sum + e.unitCount, 0);
    const computedDecoderCount = decoders.reduce((sum, d) => sum + d.unitCount, 0);

    const record = await binderStore.create({
      title: header.title,
      league: "NHL",
      containerId: "",
      eventDate: header.eventDate,
      venue: header.venue,
      showType: "Standard",
      partner: header.partner,
      status: header.status,
      isoCount,
      returnRequired: false,
      commercials: "local-insert",
      primaryTransport,
      backupTransport,
      notes,
      transport: primaryTransport,
      openIssues: 0,
      eventTime: header.eventTime,
      timezone: header.timezone,
      homeTeam: header.homeTeam,
      awayTeam: header.awayTeam,
      siteType: "Arena",
      studioLocation: "",
      customShowType: "",
      customPrimaryTransport: "",
      customBackupTransport: "",
      customCommercials: "",
      signalNamingMode,
      canonicalSignals,
      customSignalNames,
      encoderInputsPerUnit: encoders.length > 0 ? encoders[0].outputsPerUnit : 2,
      encoderCount: computedEncoderCount,
      decoderOutputsPerUnit: decoders.length > 0 ? decoders[0].outputsPerUnit : 4,
      decoderCount: computedDecoderCount,
      autoAllocate: true,
      gameType: "Regular Season",
      season: "2025–26",
      controlRoom: "23",
      rehearsalDate: header.rehearsalDate,
      broadcastFeed: header.broadcastFeed,
      onsiteTechManager: "",
      returnFeedEndpoints: [],
      encoders,
      decoders,
      outboundHost,
      outboundPort,
      inboundHost,
      inboundPort,
      lqRequired: false,
      lqPorts: [
        { letter: "E", label: "Truck AD", notes: "" },
        { letter: "F", label: "Truck Production", notes: "" },
        { letter: "G", label: "Cam Ops", notes: "" },
        { letter: "H", label: "TBD", notes: "" },
      ],
      partners: header.partners as any,
      techManagers: header.techManagers as any,
    } as any);

    if (!record) return;

    const customNames = signalNamingMode === "custom"
      ? customSignalNames.split("\n").map(n => n.trim().slice(0, 48)).filter(Boolean)
      : undefined;
    const canonicalNames = signalNamingMode === "canonical" ? canonicalSignals : undefined;
    const signals = generateSignals(isoCount, signalNamingMode as SignalNamingMode, customNames, canonicalNames);
    const encoderPatchpoints = generatePatchpoints("encoder", computedEncoderCount, encoders.length > 0 ? encoders[0].outputsPerUnit : 2);
    const decoderPatchpoints = generatePatchpoints("decoder", computedDecoderCount, decoders.length > 0 ? decoders[0].outputsPerUnit : 4);

    const finalSignals = signals.map((s, i) => ({
      ...s,
      encoderInput: i < encoderPatchpoints.length ? encoderPatchpoints[i] : s.encoderInput,
      decoderOutput: i < decoderPatchpoints.length ? decoderPatchpoints[i] : s.decoderOutput,
    }));

    const binderState = {
      league: "NHL",
      partner: header.partner,
      venue: header.venue,
      showType: "Standard",
      eventDate: header.eventDate,
      eventTime: header.eventTime,
      timezone: header.timezone,
      homeTeam: header.homeTeam,
      awayTeam: header.awayTeam,
      siteType: "Arena",
      isoCount,
      returnRequired: false,
      commercials: "local-insert",
      signals: finalSignals,
      transport: { ...DEFAULT_TRANSPORT, primary: { ...DEFAULT_TRANSPORT.primary, protocol: primaryTransport } },
      comms: [],
      issues: [],
      changes: [],
      docs: [
        { id: `d-${Date.now()}-1`, type: "Primer", name: "Production Primer", version: "1.0", uploadedBy: "System", uploadedAt: new Date().toISOString(), extractionStatus: "pending" },
        { id: `d-${Date.now()}-2`, type: "Call Sheet", name: "Call Sheet", version: "1.0", uploadedBy: "System", uploadedAt: new Date().toISOString(), extractionStatus: "pending" },
      ],
      checklist: buildChecklist(false),
      topology: {
        encoderInputsPerUnit: encoders.length > 0 ? encoders[0].outputsPerUnit : 2,
        encoderCount: computedEncoderCount,
        decoderOutputsPerUnit: decoders.length > 0 ? decoders[0].outputsPerUnit : 4,
        decoderCount: computedDecoderCount,
        encoderPatchpoints,
        decoderPatchpoints,
      },
    };
    localStorage.setItem(`mako-binder-${record.id}`, JSON.stringify(binderState));

    if (saveAsTemplate && templateName.trim()) {
      templateStore.create(templateName.trim(), {
        partner: header.partner,
        isoCount,
        returnRequired: false,
        primaryTransport,
        backupTransport,
        signalNamingMode,
        canonicalSignals,
        customSignalNames,
        timezone: header.timezone,
      });
    }

    navigate(`/binders/${record.id}`);
  };

  // Quinn mode handler (uses legacy BinderFormData shape)
  const handleQuinnCreate = async (data: any) => {
    // Delegate to the same store create
    const record = await binderStore.create(data);
    if (record) navigate(`/binders/${record.id}`);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <Link to="/binders" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Binders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-foreground tracking-tight">New Binder</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "form" ? "Configure a new NHL production binder" : "Create with Quinn — conversational setup"}
            </p>
          </div>
          <div className="flex items-center bg-secondary rounded-md border border-border p-0.5">
            <button onClick={() => setMode("form")}
              className={`text-xs px-3 py-1.5 rounded-sm transition-colors ${mode === "form" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              Form
            </button>
            <button onClick={() => setMode("quinn")}
              className={`text-xs px-3 py-1.5 rounded-sm transition-colors ${mode === "quinn" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              Quinn
            </button>
          </div>
        </div>
      </motion.div>

      {mode === "quinn" ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="steel-panel overflow-hidden" style={{ height: "calc(100vh - 180px)", minHeight: 480 }}>
          <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading Quinn…</div>}>
            <QuinnBinderAssistant onSubmit={handleQuinnCreate} onClose={() => navigate("/binders")} />
          </Suspense>
        </motion.div>
      ) : (
        <div className="space-y-8 pb-12">
          {/* ═══ BINDER HEADER (inline, full-width) ═══ */}
          <BinderHeader data={header} onChange={setHeader} />

          {/* ═══ SIGNAL CONFIGURATION ═══ */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Signal Configuration</h2>
            <div className="steel-panel p-5 space-y-5">
              <FormField label="ISO Count">
                {!customIso ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {ISO_PRESETS.map(n => (
                      <button key={n} onClick={() => setIsoCount(n)}
                        className={cn("px-3 py-1.5 text-sm rounded-sm border transition-colors font-mono",
                          isoCount === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                        {n}
                      </button>
                    ))}
                    <button onClick={() => setCustomIso(true)}
                      className="px-3 py-1.5 text-sm rounded-sm border border-border text-muted-foreground hover:text-foreground transition-colors">Custom</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={28} value={isoCount}
                      onChange={(e) => setIsoCount(Math.max(1, Math.min(28, parseInt(e.target.value) || 1)))}
                      className={cn(inputClass, "w-24 font-mono")} />
                    <button onClick={() => { setCustomIso(false); setIsoCount(12); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground">Presets</button>
                  </div>
                )}
              </FormField>

              <FormField label="Signal Naming Mode">
                <select value={signalNamingMode} onChange={(e) => setSignalNamingMode(e.target.value)} className={selectClass}>
                  <option value="iso">ISO 01..N (default)</option>
                  <option value="canonical">Canonical List</option>
                  <option value="custom">Custom List</option>
                </select>
              </FormField>

              {signalNamingMode === "canonical" && (
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">
                    Select Signals ({canonicalSignals.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-secondary/50 rounded-sm border border-border">
                    {CANONICAL_SIGNAL_NAMES.map(name => (
                      <button key={name} onClick={() => toggleCanonical(name)}
                        className={cn("px-2 py-1 text-[11px] rounded-sm border transition-colors",
                          canonicalSignals.includes(name) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {signalNamingMode === "custom" && (
                <FormField label="Signal Names (one per line, max 48 chars)">
                  <textarea value={customSignalNames} onChange={(e) => setCustomSignalNames(e.target.value)}
                    placeholder={"Beauty\nHome Bench\nAway Bench\nSpeedy\nSupra"}
                    rows={5} className={cn(inputClass, "resize-none font-mono text-xs")} />
                </FormField>
              )}
            </div>
          </motion.section>

          {/* ═══ ENCODER / DECODER ═══ */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Encoder / Decoder Topology</h2>
            <div className="steel-panel p-5 space-y-5">
              <div className="space-y-3">
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Encoders</span>
                {encoders.map((enc, idx) => (
                  <div key={enc.id} className="grid grid-cols-5 gap-2 p-3 bg-secondary/30 rounded-sm">
                    <FormField label="Brand">
                      <select value={enc.brand} onChange={(e) => { const b = e.target.value; updateEncoder(idx, { brand: b, outputsPerUnit: defaultEncOutputs(b) }); }} className={selectClass}>
                        {ENCODER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Model">
                      <input type="text" value={enc.model} onChange={(e) => updateEncoder(idx, { model: e.target.value })} placeholder="Model" className={inputClass} />
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
                      {encoders.length > 1 && (
                        <button onClick={() => removeEncoder(idx)} className="p-2 text-muted-foreground hover:text-destructive">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <button onClick={addEncoder}
                    className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-primary hover:text-foreground transition-colors">
                    <Plus className="w-3 h-3" /> Add Encoder
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground">Total: {totalEncOutputs} encode outputs</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Decoders</span>
                {decoders.map((dec, idx) => (
                  <div key={dec.id} className="grid grid-cols-5 gap-2 p-3 bg-secondary/30 rounded-sm">
                    <FormField label="Brand">
                      <select value={dec.brand} onChange={(e) => { const b = e.target.value; updateDecoder(idx, { brand: b, outputsPerUnit: defaultDecOutputs(b) }); }} className={selectClass}>
                        {DECODER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Model">
                      <input type="text" value={dec.model} onChange={(e) => updateDecoder(idx, { model: e.target.value })} placeholder="Model" className={inputClass} />
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
                      {decoders.length > 1 && (
                        <button onClick={() => removeDecoder(idx)} className="p-2 text-muted-foreground hover:text-destructive">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <button onClick={addDecoder}
                    className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-primary hover:text-foreground transition-colors">
                    <Plus className="w-3 h-3" /> Add Decoder
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground">Total: {totalDecOutputs} decoder outputs</span>
                </div>
              </div>

              {/* Capacity warnings */}
              <div className="flex flex-wrap gap-4 text-[10px]">
                <span className="text-muted-foreground">Signals: {isoCount} required</span>
                {totalEncOutputs < isoCount && (
                  <span className="text-primary flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Encoder shortfall ({totalEncOutputs} available)</span>
                )}
                {totalDecOutputs < isoCount && (
                  <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Decoder shortfall ({totalDecOutputs} available)</span>
                )}
              </div>
            </div>
          </motion.section>

          {/* ═══ TRANSPORT ═══ */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Transport</h2>
            <div className="steel-panel p-5 space-y-4">
              <FormField label="Primary Transport">
                <select value={primaryTransport} onChange={(e) => setPrimaryTransport(e.target.value)} className={selectClass}>
                  <option value="SRT">SRT</option>
                  <option value="MPEG-TS">MPEG-TS</option>
                  <option value="Fiber">Fiber</option>
                  <option value="RIST">RIST</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Outbound Host (Arena → Cloud)">
                  <input type="text" value={outboundHost} onChange={(e) => setOutboundHost(e.target.value)}
                    placeholder="srt-ingest.nhl.com" className={cn(inputClass, "font-mono")} />
                </FormField>
                <FormField label="Outbound Port">
                  <input type="text" value={outboundPort} onChange={(e) => setOutboundPort(e.target.value)}
                    placeholder="9000" className={cn(inputClass, "font-mono")} />
                </FormField>
              </div>
              <button onClick={() => setBackupOpen(!backupOpen)}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className={cn("w-3 h-3 transition-transform", backupOpen && "rotate-90")} />
                Backup Transport (Optional)
              </button>
              {backupOpen && (
                <div className="space-y-3 pl-4 border-l-2 border-border">
                  <FormField label="Backup Transport">
                    <select value={backupTransport} onChange={(e) => setBackupTransport(e.target.value)} className={selectClass}>
                      <option value="">None</option>
                      <option value="SRT">SRT</option>
                      <option value="MPEG-TS">MPEG-TS</option>
                      <option value="Fiber">Fiber</option>
                    </select>
                  </FormField>
                </div>
              )}
            </div>
          </motion.section>

          {/* ═══ NOTES ═══ */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Notes</h2>
            <div className="steel-panel p-5">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes…" rows={3}
                className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
            </div>
          </motion.section>

          {/* ═══ CHECKLIST + TEMPLATE ═══ */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="steel-panel p-5 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={seedChecklist} onChange={(e) => setSeedChecklist(e.target.checked)}
                  className="accent-[hsl(var(--primary))] w-3.5 h-3.5" />
                <span className="text-xs text-foreground">Seed default checklist</span>
                <span className="text-[10px] text-muted-foreground ml-1">(recommended)</span>
              </label>
              <div className="border-t border-border pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="accent-[hsl(var(--primary))] w-3.5 h-3.5" />
                  <span className="text-xs text-muted-foreground">Save as template</span>
                </label>
                {saveAsTemplate && (
                  <div className="mt-2">
                    <FormField label="Template Name">
                      <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g. Standard 18-ISO" className={inputClass} />
                    </FormField>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* ═══ CREATE BUTTON ═══ */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/binders")}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!header.title.trim() || !header.venue.trim()}>
              Create Binder
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
