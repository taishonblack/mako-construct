export interface BinderTemplate {
  id: string;
  name: string;
  createdAt: string;
  config: {
    league?: string;
    showType?: string;
    customShowType?: string;
    siteType?: string;
    partner?: string;
    isoCount?: number;
    returnRequired?: boolean;
    commercials?: string;
    customCommercials?: string;
    primaryTransport?: string;
    customPrimaryTransport?: string;
    backupTransport?: string;
    customBackupTransport?: string;
    signalNamingMode?: string;
    canonicalSignals?: string[];
    customSignalNames?: string;
    encoderInputsPerUnit?: number;
    encoderCount?: number;
    decoderOutputsPerUnit?: number;
    decoderCount?: number;
    autoAllocate?: boolean;
    timezone?: string;
    // Comms defaults
    commsDefaults?: boolean;
    // Checklist defaults
    checklistDefaults?: boolean;
  };
}

const STORE_KEY = "mako-binder-templates";

function load(): BinderTemplate[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function save(templates: BinderTemplate[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(templates));
}

export const templateStore = {
  getAll(): BinderTemplate[] {
    return load();
  },

  getById(id: string): BinderTemplate | undefined {
    return load().find((t) => t.id === id);
  },

  create(name: string, config: BinderTemplate["config"]): BinderTemplate {
    const all = load();
    const template: BinderTemplate = {
      id: String(Date.now()),
      name,
      createdAt: new Date().toISOString(),
      config,
    };
    all.push(template);
    save(all);
    return template;
  },

  delete(id: string): boolean {
    const all = load();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    save(all);
    return true;
  },
};
