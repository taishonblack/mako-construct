import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Building2,
  Users,
  Shield,
  ClipboardList,
  Save,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";

const STORAGE_KEY = "mako-settings";

interface OrgSettings {
  orgName: string;
  defaultLeague: string;
  timezone: string;
  encoderModel: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  access: "admin" | "editor" | "viewer";
}

interface ChecklistTemplate {
  id: string;
  name: string;
  items: string[];
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSettings(data: unknown) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const defaultOrg: OrgSettings = {
  orgName: "MAKO Broadcast Operations",
  defaultLeague: "Multi-League",
  timezone: "America/New_York",
  encoderModel: "Haivision Makito X4",
};

const defaultTeam: TeamMember[] = [
  { id: "1", name: "Alex Rivera", role: "Director of Operations", access: "admin" },
  { id: "2", name: "Jordan Kim", role: "Senior Technical Manager", access: "admin" },
  { id: "3", name: "Morgan Ellis", role: "Signal Engineer", access: "editor" },
  { id: "4", name: "Casey Novak", role: "Transport Specialist", access: "editor" },
  { id: "5", name: "Taylor Brooks", role: "Production Coordinator", access: "viewer" },
];

const defaultTemplates: ChecklistTemplate[] = [
  {
    id: "t1",
    name: "Transmission Checklist",
    items: [
      "Signal matrix complete",
      "Encoder allocation verified",
      "Decoder mapping verified",
      "Primary transport tested",
      "Backup transport tested",
      "Return feed confirmed",
    ],
  },
  {
    id: "t2",
    name: "Release Checklist",
    items: [
      "All blocking issues resolved",
      "Commercial handling confirmed",
      "Comms structure verified",
      "Timeline reviewed with partner",
      "Final validation complete",
      "Release authorized",
    ],
  },
];

const accessColors: Record<string, string> = {
  admin: "text-crimson",
  editor: "text-amber-400",
  viewer: "text-muted-foreground",
};

type SettingsTab = "organization" | "team" | "templates" | "permissions";

export default function SettingsPage() {
  const stored = loadSettings();

  const [tab, setTab] = useState<SettingsTab>("organization");
  const [org, setOrg] = useState<OrgSettings>(stored?.org ?? defaultOrg);
  const [team] = useState<TeamMember[]>(stored?.team ?? defaultTeam);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(stored?.templates ?? defaultTemplates);
  const [saved, setSaved] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");

  function persist(overrides?: { org?: OrgSettings; templates?: ChecklistTemplate[] }) {
    saveSettings({
      org: overrides?.org ?? org,
      team,
      templates: overrides?.templates ?? templates,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "team", label: "Team", icon: Users },
    { id: "templates", label: "Templates", icon: ClipboardList },
    { id: "permissions", label: "Permissions", icon: Shield },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-crimson" />
          <h1 className="text-xl font-medium text-foreground tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Organization configuration, team management, and template settings
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-1 space-y-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors ${
                tab === t.id
                  ? "bg-secondary text-foreground border-l-2 border-crimson"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm">{t.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="lg:col-span-3"
        >
          {/* Organization */}
          {tab === "organization" && (
            <div className="steel-panel p-6 space-y-6">
              <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Organization Settings</h2>
              {(
                [
                  { key: "orgName", label: "Organization Name" },
                  { key: "defaultLeague", label: "Default League" },
                  { key: "timezone", label: "Timezone" },
                  { key: "encoderModel", label: "Default Encoder Model" },
                ] as const
              ).map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-muted-foreground block mb-1.5">{field.label}</label>
                  <input
                    type="text"
                    value={org[field.key]}
                    onChange={(e) => setOrg({ ...org, [field.key]: e.target.value })}
                    className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-crimson transition-colors"
                  />
                </div>
              ))}
              <button
                onClick={() => persist({ org })}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground bg-primary rounded hover:glow-red transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {saved ? "Saved" : "Save Changes"}
              </button>
            </div>
          )}

          {/* Team */}
          {tab === "team" && (
            <div className="steel-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Team Members</h2>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded hover:bg-secondary transition-colors">
                  <Plus className="w-3 h-3" />
                  Invite Member
                </button>
              </div>
              <div className="space-y-2">
                {team.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 p-3 rounded bg-secondary/50">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground">
                      {m.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.role}</p>
                    </div>
                    <span className={`text-[10px] tracking-wider uppercase ${accessColors[m.access]}`}>
                      {m.access}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-4 text-center">
                Team management requires backend integration
              </p>
            </div>
          )}

          {/* Templates */}
          {tab === "templates" && (
            <div className="space-y-4">
              {templates.map((tpl) => (
                <div key={tpl.id} className="steel-panel p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-foreground">{tpl.name}</h3>
                    <button
                      onClick={() => setEditingTemplate(editingTemplate === tpl.id ? null : tpl.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {tpl.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground group">
                        <span className="w-1 h-1 rounded-full bg-crimson shrink-0" />
                        <span className="flex-1">{item}</span>
                        {editingTemplate === tpl.id && (
                          <button
                            onClick={() => {
                              const updated = templates.map((t) =>
                                t.id === tpl.id
                                  ? { ...t, items: t.items.filter((_, idx) => idx !== i) }
                                  : t
                              );
                              setTemplates(updated);
                              persist({ templates: updated });
                            }}
                            className="text-muted-foreground hover:text-crimson transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {editingTemplate === tpl.id && (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="New checklist item..."
                        className="flex-1 bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-crimson"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newItemText.trim()) {
                            const updated = templates.map((t) =>
                              t.id === tpl.id
                                ? { ...t, items: [...t.items, newItemText.trim()] }
                                : t
                            );
                            setTemplates(updated);
                            persist({ templates: updated });
                            setNewItemText("");
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!newItemText.trim()) return;
                          const updated = templates.map((t) =>
                            t.id === tpl.id
                              ? { ...t, items: [...t.items, newItemText.trim()] }
                              : t
                          );
                          setTemplates(updated);
                          persist({ templates: updated });
                          setNewItemText("");
                        }}
                        className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:glow-red transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => {
                  const newTpl: ChecklistTemplate = {
                    id: `t${Date.now()}`,
                    name: "New Template",
                    items: [],
                  };
                  const updated = [...templates, newTpl];
                  setTemplates(updated);
                  setEditingTemplate(newTpl.id);
                  persist({ templates: updated });
                }}
                className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-border rounded text-sm text-muted-foreground hover:text-foreground hover:border-crimson/40 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Template
              </button>
            </div>
          )}

          {/* Permissions */}
          {tab === "permissions" && (
            <div className="steel-panel p-6">
              <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-6">Role-Based Access</h2>
              <div className="space-y-4">
                {[
                  { role: "Admin", desc: "Full access to all containers, binders, settings, and team management", color: "text-crimson" },
                  { role: "Editor", desc: "Can create and modify binders, signal configurations, and transport profiles", color: "text-amber-400" },
                  { role: "Viewer", desc: "Read-only access to binders, dashboards, and reports", color: "text-muted-foreground" },
                ].map((r) => (
                  <div key={r.role} className="p-4 rounded bg-secondary/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className={`w-3.5 h-3.5 ${r.color}`} />
                      <span className={`text-sm font-medium ${r.color}`}>{r.role}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-4 text-center">
                Role assignment requires backend integration
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
