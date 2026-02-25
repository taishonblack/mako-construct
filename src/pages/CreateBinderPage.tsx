import { useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BinderFormModal, type BinderFormData } from "@/components/command/BinderFormModal";
import { binderStore } from "@/stores/binder-store";
import { generateSignals, generatePatchpoints } from "@/data/mock-signals";
import { mockTransport } from "@/data/mock-phase5";
import type { SignalNamingMode } from "@/data/mock-signals";

const QuinnBinderAssistant = lazy(() => import("@/components/quinn/QuinnBinderAssistant"));

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
  const [open, setOpen] = useState(true);
  const [seedChecklist, setSeedChecklist] = useState(true);
  const [customItems, setCustomItems] = useState<{ label: string; assignedTo: string; dueAt: string }[]>([]);
  const [mode, setMode] = useState<"form" | "quinn">("form");

  const buildChecklist = useCallback((returnRequired: boolean) => {
    const now = new Date().toISOString();
    const items: { id: string; label: string; checked: boolean; assignedTo: string; dueAt: string; createdAt: string; status: "open"; notes: string }[] = [];
    if (seedChecklist) {
      DEFAULT_CHECKLIST_SEEDS
        .filter(s => s.always || (s.label.includes("Return") && returnRequired))
        .forEach((s, i) => {
          items.push({ id: `ck-seed-${i}`, label: s.label, checked: false, assignedTo: "", dueAt: "", createdAt: now, status: "open", notes: "" });
        });
    }
    customItems.forEach((c, i) => {
      if (c.label.trim()) {
        items.push({ id: `ck-custom-${Date.now()}-${i}`, label: c.label, checked: false, assignedTo: c.assignedTo, dueAt: c.dueAt, createdAt: now, status: "open", notes: "" });
      }
    });
    return items;
  }, [seedChecklist, customItems]);

  const handleCreate = async (data: BinderFormData) => {
    const record = await binderStore.create({
      title: data.title,
      league: "NHL",
      containerId: data.containerId,
      eventDate: data.eventDate,
      venue: data.venue,
      showType: data.showType || "Standard",
      partner: data.partner,
      status: data.status,
      isoCount: data.isoCount,
      returnRequired: data.returnRequired,
      commercials: data.commercials || "local-insert",
      primaryTransport: data.primaryTransport,
      backupTransport: data.backupTransport,
      notes: data.notes,
      transport: data.primaryTransport,
      openIssues: 0,
      eventTime: data.eventTime,
      timezone: data.timezone,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      siteType: data.siteType || "Arena",
      studioLocation: data.studioLocation || "",
      customShowType: data.customShowType || "",
      customPrimaryTransport: data.customPrimaryTransport || "",
      customBackupTransport: data.customBackupTransport || "",
      customCommercials: data.customCommercials || "",
      signalNamingMode: data.signalNamingMode,
      canonicalSignals: data.canonicalSignals,
      customSignalNames: data.customSignalNames,
      encoderInputsPerUnit: data.encoderInputsPerUnit,
      encoderCount: data.encoderCount,
      decoderOutputsPerUnit: data.decoderOutputsPerUnit,
      decoderCount: data.decoderCount,
      autoAllocate: data.autoAllocate,
      gameType: data.gameType || "Regular Season",
      season: data.season || "2025–26",
      controlRoom: data.controlRoom,
      rehearsalDate: data.rehearsalDate,
      broadcastFeed: data.broadcastFeed,
      onsiteTechManager: data.onsiteTechManager,
      returnFeedEndpoints: data.returnFeedEndpoints,
      encoders: data.encoders,
      decoders: data.decoders,
      outboundHost: data.outboundHost,
      outboundPort: data.outboundPort,
      inboundHost: data.inboundHost,
      inboundPort: data.inboundPort,
      lqRequired: data.lqRequired,
      lqPorts: data.lqPorts,
    });

    if (!record) return;

    const customNames = data.signalNamingMode === "custom"
      ? data.customSignalNames.split("\n").map((n) => n.trim().slice(0, 48)).filter(Boolean)
      : undefined;
    const canonicalNames = data.signalNamingMode === "canonical" ? data.canonicalSignals : undefined;
    const signals = generateSignals(data.isoCount, data.signalNamingMode as SignalNamingMode, customNames, canonicalNames);

    const encoderPatchpoints = generatePatchpoints("encoder", data.encoderCount, data.encoderInputsPerUnit);
    const decoderPatchpoints = generatePatchpoints("decoder", data.decoderCount, data.decoderOutputsPerUnit);

    const finalSignals = data.autoAllocate
      ? signals.map((s, i) => ({
          ...s,
          encoderInput: i < encoderPatchpoints.length ? encoderPatchpoints[i] : s.encoderInput,
          decoderOutput: i < decoderPatchpoints.length ? decoderPatchpoints[i] : s.decoderOutput,
        }))
      : signals;

    const binderState = {
      league: "NHL",
      partner: data.partner,
      venue: data.venue,
      showType: data.showType || "Standard",
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      timezone: data.timezone,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      siteType: data.siteType || "Arena",
      isoCount: data.isoCount,
      returnRequired: data.returnRequired,
      commercials: data.commercials || "local-insert",
      signals: finalSignals,
      transport: {
        ...mockTransport,
        primary: {
          ...mockTransport.primary,
          protocol: data.primaryTransport,
          destination: data.outboundHost || mockTransport.primary.destination,
          port: data.outboundPort ? parseInt(data.outboundPort) : mockTransport.primary.port,
        },
        backup: {
          ...mockTransport.backup,
          protocol: data.backupTransport || "MPEG-TS",
          destination: data.backupOutboundHost || mockTransport.backup.destination,
          port: data.backupOutboundPort ? parseInt(data.backupOutboundPort) : mockTransport.backup.port,
        },
        returnFeed: data.returnRequired,
        commercials: (data.commercials || "local-insert") as "local-insert" | "pass-through" | "none",
      },
      comms: [],
      issues: [],
      changes: [],
      docs: [
        { id: `d-${Date.now()}-1`, type: "Primer", name: "Production Primer", version: "1.0", uploadedBy: "System", uploadedAt: new Date().toISOString(), extractionStatus: "pending" },
        { id: `d-${Date.now()}-2`, type: "Call Sheet", name: "Call Sheet", version: "1.0", uploadedBy: "System", uploadedAt: new Date().toISOString(), extractionStatus: "pending" },
      ],
      checklist: buildChecklist(data.returnRequired),
      topology: {
        encoderInputsPerUnit: data.encoderInputsPerUnit,
        encoderCount: data.encoderCount,
        decoderOutputsPerUnit: data.decoderOutputsPerUnit,
        decoderCount: data.decoderCount,
        encoderPatchpoints,
        decoderPatchpoints,
      },
    };
    localStorage.setItem(`mako-binder-${record.id}`, JSON.stringify(binderState));

    navigate(`/binders/${record.id}`);
  };

  const handleClose = () => {
    setOpen(false);
    navigate("/binders");
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4">
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
          {/* Form / Quinn toggle */}
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

      {mode === "form" ? (
        <BinderFormModal open={open} onClose={handleClose} onSubmit={handleCreate} mode="create"
          checklistSeed={{ seedChecklist, onSeedChange: setSeedChecklist, customItems, onCustomItemsChange: setCustomItems }} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="steel-panel overflow-hidden" style={{ height: "calc(100vh - 180px)", minHeight: 480 }}>
          <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading Quinn…</div>}>
            <QuinnBinderAssistant onSubmit={handleCreate} onClose={handleClose} />
          </Suspense>
        </motion.div>
      )}
    </div>
  );
}
