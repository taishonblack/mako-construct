import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Package,
  Calendar,
  Radio,
  BookOpen,
  Settings,
  FileText,
  Folder,
} from "lucide-react";
import { mockBinders } from "@/data/mock-binders";

function inferLeague(title: string): string {
  if (title.includes("NBA") || title.includes("WNBA")) return "NBA";
  if (title.includes("NFL")) return "NFL";
  if (title.includes("MLS")) return "MLS";
  if (title.includes("NHL")) return "NHL";
  if (title.includes("College")) return "NCAA";
  return "Other";
}

const pages = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Containers", path: "/containers", icon: Package },
  { label: "Calendar", path: "/calendar", icon: Calendar },
  { label: "Command", path: "/command", icon: Radio },
  { label: "Wiki", path: "/wiki", icon: BookOpen },
  { label: "Settings", path: "/settings", icon: Settings },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  const containers = useMemo(() => {
    const leagues = new Set(mockBinders.map((b) => inferLeague(b.title)));
    return Array.from(leagues).map((league, i) => ({
      label: `${league} 2026 Season`,
      league,
      path: `/containers/${i}`,
    }));
  }, []);

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to page, container, or binder…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.path} onSelect={() => go(p.path)} className="gap-2">
              <p.icon className="w-4 h-4 text-muted-foreground" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Containers">
          {containers.map((c) => (
            <CommandItem key={c.path} onSelect={() => go(c.path)} className="gap-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span>{c.label}</span>
              <span className="ml-auto text-[10px] tracking-wider uppercase text-muted-foreground font-mono">{c.league}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Binders">
          {mockBinders.map((b) => (
            <CommandItem key={b.id} onSelect={() => go(`/binders/${b.id}`)} className="gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <span className="truncate">{b.title}</span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{b.partner}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{b.venue.split(",")[0]}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
