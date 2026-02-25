export interface TeamMember {
  id: string;
  name: string;
  role: string;
  access: "admin" | "editor" | "viewer";
}

const STORE_KEY = "mako-team-v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

function load(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return seed();
}

function save(members: TeamMember[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(members));
  emit();
}

function seed(): TeamMember[] {
  const initial: TeamMember[] = [
    { id: "tm-1", name: "Alex Rivera", role: "Director of Operations", access: "admin" },
    { id: "tm-2", name: "Jordan Kim", role: "Senior Technical Manager", access: "admin" },
    { id: "tm-3", name: "Morgan Ellis", role: "Signal Engineer", access: "editor" },
    { id: "tm-4", name: "Casey Novak", role: "Transport Specialist", access: "editor" },
    { id: "tm-5", name: "Taylor Brooks", role: "Production Coordinator", access: "viewer" },
  ];
  save(initial);
  return initial;
}

export const teamStore = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  getAll(): TeamMember[] {
    return load();
  },

  getById(id: string): TeamMember | undefined {
    return load().find((m) => m.id === id);
  },

  create(data: Omit<TeamMember, "id">): TeamMember {
    const all = load();
    const member: TeamMember = { ...data, id: `tm-${Date.now()}` };
    all.push(member);
    save(all);
    return member;
  },

  update(id: string, partial: Partial<TeamMember>): TeamMember | undefined {
    const all = load();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...partial };
    save(all);
    return all[idx];
  },

  remove(id: string): boolean {
    const all = load();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    save(all);
    return true;
  },
};
