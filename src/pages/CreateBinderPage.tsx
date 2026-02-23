import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BinderFormModal, type BinderFormData } from "@/components/command/BinderFormModal";
import { binderStore } from "@/stores/binder-store";
import { generateSignals, generatePatchpoints } from "@/data/mock-signals";
import { mockTransport, mockComms } from "@/data/mock-phase5";
import type { SignalNamingMode } from "@/data/mock-signals";

export default function CreateBinderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
    const _searchParams = searchParams;

  const [open, setOpen] = useState(true);

  const handleCreate = (data: BinderFormData) => {
    // Create binder record in store
    const record = binderStore.create({
      title: data.title,
      league: "NHL",
      containerId: data.containerId,
      eventDate: data.eventDate,
      venue: data.venue,
      showType: data.showType === "Other" ? data.customShowType || "Other" : data.showType,
      partner: data.partner,
      status: data.status,
      isoCount: data.isoCount,
      returnRequired: data.returnRequired,
      commercials: data.commercials === "Other" ? data.customCommercials || "Other" : data.commercials,
      primaryTransport: data.primaryTransport === "Other" ? data.customPrimaryTransport || "Other" : data.primaryTransport,
      backupTransport: data.backupTransport === "Other" ? data.customBackupTransport || "Other" : data.backupTransport,
      notes: data.notes,
      transport: data.primaryTransport === "Other" ? data.customPrimaryTransport || "Other" : data.primaryTransport,
      openIssues: 0,
      eventTime: data.eventTime,
      timezone: data.timezone,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      siteType: data.siteType,
      studioLocation: data.studioLocation,
      customShowType: data.customShowType,
      customPrimaryTransport: data.customPrimaryTransport,
      customBackupTransport: data.customBackupTransport,
      customCommercials: data.customCommercials,
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
    });

    // Generate signals based on naming mode
    const customNames = data.signalNamingMode === "custom"
      ? data.customSignalNames.split("\n").map((n) => n.trim()).filter(Boolean)
      : undefined;
    const canonicalNames = data.signalNamingMode === "canonical"
      ? data.canonicalSignals
      : undefined;

    const signals = generateSignals(
      data.isoCount,
      data.signalNamingMode as SignalNamingMode,
      customNames,
      canonicalNames
    );

    // Generate patchpoints from topology
    const encoderPatchpoints = generatePatchpoints("encoder", data.encoderCount, data.encoderInputsPerUnit);
    const decoderPatchpoints = generatePatchpoints("decoder", data.decoderCount, data.decoderOutputsPerUnit);

    // Auto-allocate patchpoints if enabled
    const finalSignals = data.autoAllocate
      ? signals.map((s, i) => ({
          ...s,
          encoderInput: i < encoderPatchpoints.length ? encoderPatchpoints[i] : s.encoderInput,
          decoderOutput: i < decoderPatchpoints.length ? decoderPatchpoints[i] : s.decoderOutput,
        }))
      : signals;

    const resolvedPrimaryTransport = data.primaryTransport === "Other" ? data.customPrimaryTransport || "Other" : data.primaryTransport;
    const resolvedBackupTransport = data.backupTransport === "Other" ? data.customBackupTransport || "Other" : data.backupTransport;

    // Initialize binder state in localStorage
    const binderState = {
      league: "NHL",
      partner: data.partner,
      venue: data.venue,
      showType: data.showType === "Other" ? data.customShowType || "Other" : data.showType,
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      timezone: data.timezone,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      siteType: data.siteType,
      isoCount: data.isoCount,
      returnRequired: data.returnRequired,
      commercials: data.commercials === "Other" ? data.customCommercials || "Other" : data.commercials,
      signals: finalSignals,
      transport: {
        ...mockTransport,
        primary: {
          ...mockTransport.primary,
          protocol: resolvedPrimaryTransport,
          destination: data.srtPrimaryHost || mockTransport.primary.destination,
          port: data.srtPrimaryPort ? parseInt(data.srtPrimaryPort) : mockTransport.primary.port,
        },
        backup: {
          ...mockTransport.backup,
          protocol: resolvedBackupTransport,
          destination: data.srtBackupHost || mockTransport.backup.destination,
          port: data.srtBackupPort ? parseInt(data.srtBackupPort) : mockTransport.backup.port,
        },
        returnFeed: data.returnRequired,
        commercials: (data.commercials === "Other" ? "none" : data.commercials) as "local-insert" | "pass-through" | "none",
      },
      comms: [...mockComms],
      issues: [],
      changes: [],
      docs: [
        { id: `d-${Date.now()}-1`, type: "Primer", name: "Production Primer", version: "1.0", uploadedBy: "System", uploadedAt: new Date().toISOString(), extractionStatus: "pending" },
        { id: `d-${Date.now()}-2`, type: "Call Sheet", name: "Call Sheet", version: "1.0", uploadedBy: "System", uploadedAt: new Date().toISOString(), extractionStatus: "pending" },
        { id: `d-${Date.now()}-3`, type: "Schedule", name: "Schedule", version: "1.0", uploadedBy: "System", uploadedAt: new Date().toISOString(), extractionStatus: "pending" },
      ],
      checklist: [
        { id: "ck1", label: "Fax Completed", checked: false },
        { id: "ck2", label: "Validation Complete", checked: false },
        { id: "ck3", label: "Transmission Tested", checked: false },
        { id: "ck4", label: "Return Confirmed", checked: false },
        { id: "ck5", label: "Encoder Allocation Verified", checked: false },
        { id: "ck6", label: "Decoder Mapping Verified", checked: false },
        { id: "ck7", label: "Commercial Handling Confirmed", checked: false },
        { id: "ck8", label: "Release Confirmed", checked: false },
      ],
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
    navigate("/containers");
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Link
          to="/containers"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Productions
        </Link>
        <h1 className="text-xl font-medium text-foreground tracking-tight">New Production</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure a new NHL production binder</p>
      </motion.div>

      <BinderFormModal
        open={open}
        onClose={handleClose}
        onSubmit={handleCreate}
        mode="create"
      />
    </div>
  );
}
