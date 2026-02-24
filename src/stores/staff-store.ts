export interface StaffMember {
  id: string;
  name: string;
  org: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
  tags: string[]; // "NHL" | "Partner" | "Vendor" | "Truck" | "Transmission"
}

const STORE_KEY = "mako-staff-v1";

function load(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return seedStaff();
}

function save(members: StaffMember[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(members));
}

function seedStaff(): StaffMember[] {
  const seed: StaffMember[] = [
    { id: "staff-1", name: "Mike Torres", org: "NHL", role: "Tech Manager", phone: "212-555-0101", email: "mtorres@nhl.com", notes: "CR-23 lead", tags: ["NHL", "Transmission"] },
    { id: "staff-2", name: "Sarah Chen", org: "NHL", role: "Producer", phone: "212-555-0102", email: "schen@nhl.com", notes: "", tags: ["NHL"] },
    { id: "staff-3", name: "Dave Martin", org: "ESPN", role: "Technical Director", phone: "860-555-0201", email: "dmartin@espn.com", notes: "ESPN Bristol", tags: ["Partner"] },
    { id: "staff-4", name: "Lisa Park", org: "SportsNet CA", role: "Coordinator", phone: "416-555-0301", email: "lpark@sportsnet.ca", notes: "", tags: ["Partner"] },
    { id: "staff-5", name: "James Wu", org: "Bitfire", role: "Remote Ops Lead", phone: "310-555-0401", email: "jwu@bitfire.tv", notes: "Bitfire remote call support", tags: ["Vendor"] },
    { id: "staff-6", name: "Rachel Adams", org: "NHL", role: "Audio A1", phone: "212-555-0103", email: "radams@nhl.com", notes: "CR-26 audio", tags: ["NHL", "Truck"] },
    { id: "staff-7", name: "Tom Baxter", org: "Beyond Sports", role: "Animation Lead", phone: "415-555-0501", email: "tbaxter@beyondsports.com", notes: "", tags: ["Vendor"] },
  ];
  save(seed);
  return seed;
}

export const staffStore = {
  getAll(): StaffMember[] {
    return load();
  },

  getById(id: string): StaffMember | undefined {
    return load().find((m) => m.id === id);
  },

  create(data: Omit<StaffMember, "id">): StaffMember {
    const all = load();
    const member: StaffMember = { ...data, id: `staff-${Date.now()}` };
    all.push(member);
    save(all);
    return member;
  },

  update(id: string, partial: Partial<StaffMember>): StaffMember | undefined {
    const all = load();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...partial };
    save(all);
    return all[idx];
  },

  delete(id: string): boolean {
    const all = load();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    save(all);
    return true;
  },

  getByTag(tag: string): StaffMember[] {
    return load().filter((m) => m.tags.includes(tag));
  },
};
