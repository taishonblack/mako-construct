import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BinderFormModal, type BinderFormData } from "@/components/command/BinderFormModal";
import { binderStore } from "@/stores/binder-store";
import { generateSignals } from "@/data/mock-signals";
import { mockTransport, mockComms, mockDocs } from "@/data/mock-phase5";

export default function CreateBinderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLeague = searchParams.get("league") || "";

  const [open, setOpen] = useState(true);

  const handleCreate = (data: BinderFormData) => {
    // Create binder record in store
    const record = binderStore.create({
      title: data.title,
      league: data.league,
      containerId: data.containerId,
      eventDate: data.eventDate,
      venue: data.venue,
      showType: data.showType,
      partner: data.partner,
      status: data.status,
      isoCount: data.isoCount,
      returnRequired: data.returnRequired,
      commercials: data.commercials,
      primaryTransport: data.primaryTransport,
      backupTransport: data.backupTransport,
      notes: data.notes,
      transport: data.primaryTransport,
      openIssues: 0,
    });

    // Initialize binder state in localStorage (signals, docs, checklist, etc.)
    const binderState = {
      league: data.league,
      partner: data.partner,
      venue: data.venue,
      showType: data.showType,
      eventDate: data.eventDate,
      isoCount: data.isoCount,
      returnRequired: data.returnRequired,
      commercials: data.commercials,
      signals: generateSignals(data.isoCount),
      transport: {
        ...mockTransport,
        primary: { ...mockTransport.primary, protocol: data.primaryTransport },
        backup: { ...mockTransport.backup, protocol: data.backupTransport },
        returnFeed: data.returnRequired,
        commercials: data.commercials as "local-insert" | "pass-through" | "none",
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
          Containers
        </Link>
        <h1 className="text-xl font-medium text-foreground tracking-tight">New Binder</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure a new production binder</p>
      </motion.div>

      <BinderFormModal
        open={open}
        onClose={handleClose}
        onSubmit={handleCreate}
        mode="create"
        initial={preselectedLeague ? { league: preselectedLeague } : undefined}
      />
    </div>
  );
}
