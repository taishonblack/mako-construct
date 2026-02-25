import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronRight, Loader2, BookOpen, Clock, ListTodo, Users, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { binderStore } from "@/stores/binder-store";
import { teamStore } from "@/stores/team-store";
import type { CallSheetExtraction, ImportPlan } from "@/types/callsheet-import";

interface CreateSection {
  key: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  enabled: boolean;
  details: string[];
}

interface Props {
  extraction: CallSheetExtraction;
  plan: ImportPlan;
  creating: boolean;
  setCreating: (v: boolean) => void;
  onBack: () => void;
  onClose: () => void;
}

export function StepCreate({ extraction, plan, creating, setCreating, onBack, onClose }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [disabled, setDisabled] = useState<Set<string>>(new Set());

  const sections = useMemo<CreateSection[]>(() => {
    const s: CreateSection[] = [];

    // Binder
    s.push({
      key: "binder",
      label: plan.target === "new" ? `Create Binder: "${extraction.showTitle}"` : "Attach to existing binder",
      icon: <BookOpen className="w-3.5 h-3.5" />,
      count: 1,
      enabled: true,
      details: [
        `Title: ${extraction.showTitle}`,
        `Date: ${extraction.showDate}`,
        `Air Time: ${extraction.airTime}`,
        `Venue: ${extraction.venue}`,
        `Control Room: ${plan.controlRoom}`,
      ],
    });

    // Timeline
    if (plan.createTimeline && extraction.callTimes?.length > 0) {
      const items = plan.timelineScope === "key-only"
        ? extraction.callTimes.filter((ct) => ["Crew Call", "ON AIR", "Air", "Puck Drop", "Wrap"].some(k => ct.label.toLowerCase().includes(k.toLowerCase())))
        : extraction.callTimes;
      s.push({
        key: "timeline",
        label: `${items.length} timeline events`,
        icon: <Clock className="w-3.5 h-3.5" />,
        count: items.length,
        enabled: true,
        details: items.map((ct) => `${ct.time} — ${ct.label}`),
      });
    }

    // Tasks
    if (plan.createTasks && extraction.tasks?.length > 0) {
      s.push({
        key: "tasks",
        label: `${extraction.tasks.length} tasks`,
        icon: <ListTodo className="w-3.5 h-3.5" />,
        count: extraction.tasks.length,
        enabled: true,
        details: extraction.tasks.map((t) => `[${t.departmentTag}] ${t.title}`),
      });
    }

    // Staff
    if (plan.addStaff && extraction.staff?.length > 0) {
      s.push({
        key: "staff",
        label: `${extraction.staff.length} staff members`,
        icon: <Users className="w-3.5 h-3.5" />,
        count: extraction.staff.length,
        enabled: true,
        details: extraction.staff.map((st) => `${st.name} — ${st.role}`),
      });
    }

    // Routes
    if (plan.updateRoutes && extraction.routeHints && extraction.routeHints.length > 0) {
      s.push({
        key: "routes",
        label: `${extraction.routeHints.length} route updates`,
        icon: <Route className="w-3.5 h-3.5" />,
        count: extraction.routeHints.length,
        enabled: true,
        details: extraction.routeHints.map((r) => `${r.txId}${r.isoName ? ` → ${r.isoName}` : ""}`),
      });
    }

    return s;
  }, [extraction, plan]);

  const toggleSection = useCallback((key: string) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const enabledSections = sections.filter((s) => !disabled.has(s.key));
  const totalObjects = enabledSections.reduce((acc, s) => acc + s.count, 0);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      let binderId: string | undefined;

      // Create binder
      if (!disabled.has("binder")) {
        if (plan.target === "new") {
          const newBinder = await binderStore.create({
            title: extraction.showTitle,
            partner: "",
            venue: extraction.venue,
            eventDate: extraction.showDate,
            status: "draft",
            isoCount: extraction.routeHints?.length || 12,
            openIssues: 0,
            transport: "SRT",
            league: extraction.league || "NHL",
            containerId: "",
            showType: extraction.productionType || "Standard",
            returnRequired: false,
            commercials: "local-insert",
            primaryTransport: "SRT",
            backupTransport: "MPEG-TS",
            notes: extraction.notes || "",
            eventTime: extraction.airTime || "19:00",
            timezone: "America/New_York",
            homeTeam: extraction.homeTeam || "",
            awayTeam: extraction.awayTeam || "",
            siteType: extraction.facility ? "Studio" : "Arena",
            studioLocation: extraction.facility || "",
            customShowType: "",
            customPrimaryTransport: "",
            customBackupTransport: "",
            customCommercials: "",
            signalNamingMode: "iso",
            canonicalSignals: [],
            customSignalNames: "",
            encoderInputsPerUnit: 2,
            encoderCount: 6,
            decoderOutputsPerUnit: 4,
            decoderCount: 6,
            autoAllocate: true,
            gameType: "Regular Season",
            season: "2025–26",
            controlRoom: plan.controlRoom,
            rehearsalDate: "",
            broadcastFeed: "",
            onsiteTechManager: "",
            returnFeedEndpoints: [],
            encoders: [{ id: "enc-1", brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 2, notes: "" }],
            decoders: [{ id: "dec-1", brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 6, notes: "" }],
            outboundHost: "",
            outboundPort: "",
            inboundHost: "",
            inboundPort: "",
            lqRequired: false,
            lqPorts: [],
          });
          binderId = newBinder?.id;
        } else {
          binderId = plan.existingBinderId;
        }
      }

      // Add staff to team directory
      if (!disabled.has("staff") && plan.addStaff && extraction.staff?.length > 0) {
        const existingMembers = await teamStore.getAll();
        const existingNames = new Set(existingMembers.map((m) => m.name.toLowerCase()));
        for (const s of extraction.staff) {
          if (!existingNames.has(s.name.toLowerCase())) {
            await teamStore.create({ name: s.name, role: s.role, access: "viewer" });
          }
        }
      }

      // Tasks and timeline are stored in the binder's localStorage state for now
      // They'll be picked up when the user opens the binder
      if (binderId && !disabled.has("timeline") && plan.createTimeline) {
        const storageKey = `mako-binder-${binderId}`;
        const existing = localStorage.getItem(storageKey);
        const state = existing ? JSON.parse(existing) : {};
        const timelineItems = extraction.callTimes.map((ct, i) => ({
          id: `ck-import-${Date.now()}-${i}`,
          label: `[${ct.time}] ${ct.label}`,
          checked: false,
          assignedTo: "",
          dueAt: "",
          createdAt: new Date().toISOString(),
          status: "open",
          notes: ct.category ? `Category: ${ct.category}` : "",
        }));
        state.checklist = [...(state.checklist || []), ...timelineItems];
        localStorage.setItem(storageKey, JSON.stringify(state));
      }

      if (binderId && !disabled.has("tasks") && plan.createTasks && extraction.tasks?.length > 0) {
        const storageKey = `mako-binder-${binderId}`;
        const existing = localStorage.getItem(storageKey);
        const state = existing ? JSON.parse(existing) : {};
        const taskItems = extraction.tasks.map((t, i) => ({
          id: `ck-task-${Date.now()}-${i}`,
          label: t.title,
          checked: false,
          assignedTo: "",
          dueAt: t.dueTime || "",
          createdAt: new Date().toISOString(),
          status: "open",
          notes: `Department: ${t.departmentTag}`,
        }));
        state.checklist = [...(state.checklist || []), ...taskItems];
        localStorage.setItem(storageKey, JSON.stringify(state));
      }

      toast({
        title: "Import complete",
        description: `Created ${totalObjects} objects${binderId ? ` in binder` : ""}.`,
      });

      onClose();

      if (binderId) {
        navigate(`/binders/${binderId}`);
      }
    } catch (err: any) {
      console.error("Import create error:", err);
      toast({ title: "Import failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }, [disabled, extraction, plan, totalObjects, onClose, navigate, setCreating]);

  return (
    <div className="space-y-4">
      <div>
        <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-3">This import will create:</span>
        <div className="space-y-2">
          {sections.map((s) => {
            const isDisabled = disabled.has(s.key);
            const isExpanded = expanded.has(s.key);

            return (
              <div key={s.key} className={`rounded-sm border transition-colors ${isDisabled ? "border-border/50 opacity-50" : "border-border"}`}>
                <div className="flex items-center gap-2 p-3">
                  <Checkbox
                    checked={!isDisabled}
                    onCheckedChange={() => s.key !== "binder" && toggleSection(s.key)}
                    disabled={s.key === "binder"}
                  />
                  <span className="text-primary">{s.icon}</span>
                  <span className="text-xs text-foreground flex-1 min-w-0 truncate">{s.label}</span>
                  {s.details.length > 0 && (
                    <button onClick={() => toggleExpand(s.key)} className="p-0.5 text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 space-y-0.5 border-t border-border/50 mt-0">
                    {s.details.map((d, i) => (
                      <p key={i} className="text-[10px] text-muted-foreground font-mono truncate py-0.5 pl-7">
                        {d}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={creating} className="text-[10px] uppercase tracking-wider">
          ← Back
        </Button>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={creating || enabledSections.length === 0}
          className="flex-1 text-[10px] uppercase tracking-wider"
        >
          {creating ? (
            <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Creating…</>
          ) : (
            <><Check className="w-3 h-3 mr-1" /> Create {totalObjects} Objects</>
          )}
        </Button>
      </div>
    </div>
  );
}
