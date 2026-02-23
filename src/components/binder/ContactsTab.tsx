import { useState } from "react";
import { Search, Copy, Check } from "lucide-react";
import type { Contact } from "@/data/mock-binder-detail";

const locationOrder = ["Truck", "Studio", "Arena", "Transmission", "Partner"];

export function ContactsTab({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = locationOrder
    .map((loc) => ({
      location: loc,
      members: filtered.filter((c) => c.location === loc),
    }))
    .filter((g) => g.members.length > 0);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors"
        />
      </div>

      {/* Grouped contacts */}
      {grouped.map((group) => (
        <div key={group.location} className="steel-panel">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-[10px] tracking-wider uppercase text-muted-foreground">{group.location}</h3>
          </div>
          <div className="divide-y divide-border">
            {group.members.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.role}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => copyToClipboard(contact.phone, `phone-${contact.id}`)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy phone"
                  >
                    {copied === `phone-${contact.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span className="font-mono">{contact.phone}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(contact.email, `email-${contact.id}`)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy email"
                  >
                    {copied === `email-${contact.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{contact.email}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
