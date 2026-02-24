import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BinderFormModal, type BinderFormData } from "@/components/command/BinderFormModal";
import { binderStore } from "@/stores/binder-store";
import { generateSignals, generatePatchpoints } from "@/data/mock-signals";
import { mockTransport, mockComms } from "@/data/mock-phase5";
import type { SignalNamingMode } from "@/data/mock-signals";

const DEFAULT_CHECKLIST = [
  { id: "ck1", label: "Confirm ISO count", checked: false },
  { id: "ck2", label: "Encoder allocation verified", checked: false },
  { id: "ck3", label: "Decoder mapping verified", checked: false },
  { id: "ck4", label: "Transport primary tested", checked: false },
  { id: "ck5", label: "Return feed request sent to partner", checked: false },
  { id: "ck6", label: "Comms confirmed", checked: false },
  { id: "ck7", label: "Release confirmed", checked: false },
];

export default function CreateBinderPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleCreate = (data: BinderFormData) => {
    const record = binderStore.create({
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
      // New V1 fields
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

    // Generate signals
    const customNames = data.signalNamingMode === "custom"
      ? data.customSignalNames.split("\n").map((n) => n.trim().slice(0, 48)).filter(Boolean)
      : undefined;
    const canonicalNames = data.signalNamingMode === "canonical" ? data.canonicalSignals : undefined;
    const signals = generateSignals(data.isoCount, data.signalNamingMode as SignalNamingMode, customNames, canonicalNames);

    // Generate patchpoints from computed topology
    const encoderPatchpoints = generatePatchpoints("encoder", data.encoderCount, data.encoderInputsPerUnit);
    const decoderPatchpoints = generatePatchpoints("decoder", data.decoderCount, data.decoderOutputsPerUnit);

    // Auto-allocate
    const finalSignals = data.autoAllocate
      ? signals.map((s, i) => ({
          ...s,
          encoderInput: i < encoderPatchpoints.length ? encoderPatchpoints[i] : s.encoderInput,
          decoderOutput: i < decoderPatchpoints.length ? decoderPatchpoints[i] : s.decoderOutput,
        }))
      : signals;

    // Initialize binder state
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
      comms: [...mockComms],
      issues: [],
      changes: [],
      docs: [
        { id: `d-${Date.now()}-1`, type: "Primer", name: "Production Primer", version: "1.0", uploadedBy: "System", uploadedAt: new Date().toISOString(), extractionStatus: "pending" },
        { id: `d-${Date.now()}-2`, type: "Call Sheet", name: "Call Sheet", version: "1.0", uploadedBy: "System", uploadedAt: new Date().toISOString(), extractionStatus: "pending" },
      ],
      checklist: DEFAULT_CHECKLIST,
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <Link to="/binders" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Binders
        </Link>
        <h1 className="text-xl font-medium text-foreground tracking-tight">New Binder</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure a new NHL production binder</p>
      </motion.div>

      <BinderFormModal open={open} onClose={handleClose} onSubmit={handleCreate} mode="create" />
    </div>
  );
}
