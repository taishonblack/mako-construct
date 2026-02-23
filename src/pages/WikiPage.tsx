import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Cpu,
  Monitor,
  Wifi,
  Headphones,
  FileCheck,
  ClipboardList,
  Tag,
  BookOpen,
  ChevronRight,
  Pencil,
  Save,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";

interface WikiBlock {
  heading: string;
  items: string[];
}

interface WikiSection {
  id: string;
  title: string;
  iconName: string;
  description: string;
  content: WikiBlock[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  Radio, Cpu, Monitor, Wifi, Headphones, FileCheck, ClipboardList, Tag,
};

const STORAGE_KEY = "mako-wiki";

const defaultSections: WikiSection[] = [
  {
    id: "signal-standards",
    title: "Signal Standards",
    iconName: "Radio",
    description: "ISO naming rules, alias conventions, and destination mapping standards.",
    content: [
      { heading: "ISO Naming Convention", items: ["Format: ISO-[NUMBER]-[TYPE] (e.g., ISO-01-GAME, ISO-14-BEAUTY)", "Game cameras: ISO-01 through ISO-08", "Specialty cameras: ISO-09 through ISO-16", "Beauty / scenic: ISO-14, ISO-15", "Slash / handheld: ISO-16+"] },
      { heading: "Production Alias Rules", items: ["Aliases must be unique within a binder", "Use descriptive shorthand: SLASH-1, BEAUTY-WIDE, JIBCAM-1", "Never reuse aliases across different ISO numbers in the same event"] },
      { heading: "Destination Naming", items: ["Format: [PARTNER]-[FACILITY]-[PORT]", "Example: ESPN-BRC-A01, FOX-NYC-D12", "Return destinations use suffix -RTN"] },
    ],
  },
  {
    id: "encoder-standards",
    title: "Encoder Standards",
    iconName: "Cpu",
    description: "Approved encoder models, input allocation, and failover requirements.",
    content: [
      { heading: "Approved Encoder Models", items: ["Primary: Haivision Makito X4", "Secondary: Haivision KB", "Legacy support: Makito X (Phase-out Q4 2026)"] },
      { heading: "Input Allocation Rules", items: ["Maximum 2 ISOs per encoder input pair", "Game cameras require dedicated encoder ports", "Beauty and scenic can share encoder pairs", "Minimum encoder capacity = ceil(ISO count / 2)"] },
      { heading: "Failover Requirements", items: ["All Tier-1 events require N+1 encoder redundancy", "Backup encoder must be pre-configured and tested", "Hot standby required for playoff / championship events"] },
    ],
  },
  {
    id: "decoder-topology",
    title: "Decoder Topology",
    iconName: "Monitor",
    description: "Decoder assignment rules and HQ routing standards.",
    content: [
      { heading: "Assignment Rules", items: ["Each signal requires a dedicated decoder output", "Decoder outputs are mapped 1:1 to HQ patch points", "Unassigned decoder outputs trigger Risk readiness status"] },
      { heading: "HQ Routing Standards", items: ["Format: HQ-[RACK]-[PORT] (e.g., HQ-R04-P12)", "Primary routing through Rack 01–08", "Backup routing through Rack 09–12", "All decoder outputs must have confirmed HQ patch before Ready status"] },
    ],
  },
  {
    id: "transport-profiles",
    title: "Transport Profiles",
    iconName: "Wifi",
    description: "SRT, MPEG-TS standards, backup requirements, and return feed policies.",
    content: [
      { heading: "SRT Standards", items: ["Default latency: 120ms (adjustable per event)", "Encryption: AES-128 required for all production feeds", "Port range: 9000–9999 (assigned per event)", "Caller mode for outbound, Listener mode for inbound"] },
      { heading: "MPEG-TS Standards", items: ["Bitrate: 15 Mbps CBR for HD, 45 Mbps for UHD", "FEC: Pro-MPEG required on all primary paths", "Multicast addressing: 239.x.x.x range only"] },
      { heading: "Backup Requirements", items: ["All Tier-1 events require a defined backup transport path", "Backup can differ from primary protocol", "Failover tested minimum 2 hours before air", "Missing backup transport triggers Risk readiness"] },
      { heading: "Return Feed Policy", items: ["Return feed required for all partner-facing events", "Return uses reverse transport path (same protocol preferred)", "Missing return when required triggers Blocked readiness"] },
    ],
  },
  {
    id: "comms-standards",
    title: "Comms Standards",
    iconName: "Headphones",
    description: "Clear-Com channel assignments, LQ naming, and hot mic policies.",
    content: [
      { heading: "Clear-Com Channel Assignments", items: ["CH01: Production (Director, AD, Producer)", "CH02: Technical (TD, Engineering, Shader)", "CH03: Cameras (Camera operators, Jib, Steadicam)", "CH04: Audio / Comms (A1, A2, Comms Tech)", "CH05–CH08: Reserved for event-specific needs"] },
      { heading: "LQ 4-Wire Naming", items: ["Format: LQ-[LOCATION]-[NUMBER]", "Example: LQ-TRUCK-01, LQ-HQ-04", "Maximum 8 LQ circuits per event"] },
      { heading: "Hot Mic Policies", items: ["Production and Technical channels are always hot", "Camera channel hot only during show", "All hot mics must be documented in binder comms section"] },
    ],
  },
  {
    id: "production-protocols",
    title: "Production Protocols",
    iconName: "FileCheck",
    description: "Release procedures, go/no-go criteria, and escalation paths.",
    content: [
      { heading: "Release Procedure", items: ["All checklist items must be complete", "Readiness must be Ready (green) or Risk with documented acceptance", "Blocked events cannot be released without VP-level override", "Release timestamp is recorded in binder execution history"] },
      { heading: "Go/No-Go Criteria", items: ["Signal matrix 100% mapped", "Transport primary confirmed", "Return feed confirmed (if required)", "Encoder capacity sufficient", "No unresolved high-priority issues"] },
    ],
  },
  {
    id: "naming-conventions",
    title: "Naming Conventions",
    iconName: "Tag",
    description: "Standardized naming across binders, containers, and configuration fields.",
    content: [
      { heading: "Container Naming", items: ["Format: [LEAGUE] [YEAR] [TYPE]", "Examples: NHL 2026 Season, NBA 2026 Playoffs, MLS Cup 2026"] },
      { heading: "Binder Naming", items: ["Format: [EVENT DESCRIPTION] — [TEAMS/DETAIL]", "Examples: NHL Opening Night — NYR vs BOS, NFL Wild Card — DAL vs PHI", "Include partner in metadata, not in title"] },
    ],
  },
  {
    id: "checklist-templates",
    title: "Checklist Templates",
    iconName: "ClipboardList",
    description: "Standard checklist templates that auto-seed new binders.",
    content: [
      { heading: "Transmission Checklist", items: ["☐ Signal matrix complete", "☐ Encoder allocation verified", "☐ Decoder mapping verified", "☐ Primary transport tested", "☐ Backup transport tested", "☐ Return feed confirmed"] },
      { heading: "Release Checklist", items: ["☐ All blocking issues resolved", "☐ Commercial handling confirmed", "☐ Comms structure verified", "☐ Timeline reviewed with partner", "☐ Final validation complete", "☐ Release authorized"] },
    ],
  },
];

function loadWiki(): WikiSection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultSections;
  } catch {
    return defaultSections;
  }
}

export default function WikiPage() {
  const [sections, setSections] = useState<WikiSection[]>(loadWiki);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editingBlockIdx, setEditingBlockIdx] = useState<number | null>(null);

  const persist = useCallback((data: WikiSection[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const active = sections.find((s) => s.id === activeSection);
  const ActiveIcon = active ? (ICON_MAP[active.iconName] || BookOpen) : BookOpen;

  function updateItem(sectionId: string, blockIdx: number, itemIdx: number, value: string) {
    const updated = sections.map((s) => {
      if (s.id !== sectionId) return s;
      const newContent = s.content.map((block, bi) => {
        if (bi !== blockIdx) return block;
        const newItems = [...block.items];
        newItems[itemIdx] = value;
        return { ...block, items: newItems };
      });
      return { ...s, content: newContent };
    });
    setSections(updated);
    persist(updated);
  }

  function deleteItem(sectionId: string, blockIdx: number, itemIdx: number) {
    const updated = sections.map((s) => {
      if (s.id !== sectionId) return s;
      const newContent = s.content.map((block, bi) => {
        if (bi !== blockIdx) return block;
        return { ...block, items: block.items.filter((_, i) => i !== itemIdx) };
      });
      return { ...s, content: newContent };
    });
    setSections(updated);
    persist(updated);
  }

  function addItem(sectionId: string, blockIdx: number, text: string) {
    if (!text.trim()) return;
    const updated = sections.map((s) => {
      if (s.id !== sectionId) return s;
      const newContent = s.content.map((block, bi) => {
        if (bi !== blockIdx) return block;
        return { ...block, items: [...block.items, text.trim()] };
      });
      return { ...s, content: newContent };
    });
    setSections(updated);
    persist(updated);
    setNewItemText("");
  }

  function resetToDefaults() {
    setSections(defaultSections);
    persist(defaultSections);
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-crimson" />
            <h1 className="text-xl font-medium text-foreground tracking-tight">Wiki</h1>
          </div>
          <div className="flex items-center gap-2">
            {active && (
              <button
                onClick={() => setEditing(!editing)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                  editing
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground border border-border hover:bg-secondary"
                }`}
              >
                {editing ? <Save className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                {editing ? "Done" : "Edit"}
              </button>
            )}
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded hover:bg-secondary transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          League-level operational standards and institutional knowledge
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-1 space-y-1"
        >
          {sections.map((section) => {
            const Icon = ICON_MAP[section.iconName] || BookOpen;
            return (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id === activeSection ? null : section.id); setEditing(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors ${
                  activeSection === section.id
                    ? "bg-secondary text-foreground border-l-2 border-crimson"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{section.title}</span>
                <ChevronRight className={`w-3.5 h-3.5 ml-auto shrink-0 transition-transform ${activeSection === section.id ? "rotate-90" : ""}`} />
              </button>
            );
          })}
        </motion.div>

        {/* Content panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="lg:col-span-3"
        >
          {active ? (
            <div className="steel-panel p-6">
              <div className="flex items-center gap-3 mb-2">
                <ActiveIcon className="w-5 h-5 text-crimson" />
                <h2 className="text-lg font-medium text-foreground">{active.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{active.description}</p>

              <div className="space-y-6">
                {active.content.map((block, blockIdx) => (
                  <div key={blockIdx}>
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
                      {block.heading}
                    </h3>
                    <ul className="space-y-1.5">
                      {block.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-sm text-foreground flex items-start gap-2 group">
                          <span className="w-1 h-1 rounded-full bg-crimson mt-2 shrink-0" />
                          {editing ? (
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateItem(active.id, blockIdx, itemIdx, e.target.value)}
                              className="flex-1 bg-transparent border-b border-border focus:border-crimson outline-none text-sm text-foreground py-0.5"
                            />
                          ) : (
                            <span className="flex-1">{item}</span>
                          )}
                          {editing && (
                            <button
                              onClick={() => deleteItem(active.id, blockIdx, itemIdx)}
                              className="text-muted-foreground hover:text-crimson transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    {editing && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={editingBlockIdx === blockIdx ? newItemText : ""}
                          onFocus={() => setEditingBlockIdx(blockIdx)}
                          onChange={(e) => { setEditingBlockIdx(blockIdx); setNewItemText(e.target.value); }}
                          placeholder="Add item..."
                          className="flex-1 bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-crimson"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editingBlockIdx === blockIdx) {
                              addItem(active.id, blockIdx, newItemText);
                            }
                          }}
                        />
                        <button
                          onClick={() => { if (editingBlockIdx === blockIdx) addItem(active.id, blockIdx, newItemText); }}
                          className="px-2 py-1.5 bg-primary text-primary-foreground rounded hover:glow-red transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="steel-panel p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section) => {
                  const Icon = ICON_MAP[section.iconName] || BookOpen;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className="p-4 rounded bg-secondary/30 hover:bg-secondary/60 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-crimson" />
                        <span className="text-sm font-medium text-foreground">{section.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
