import { useState, useRef, useEffect } from "react";
import { useTeam } from "@/hooks/use-team";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Search, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMemberSelectProps {
  value: string;           // assignedTo name (display)
  valueId?: string;        // assignedToId
  onChange: (name: string, id: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TeamMemberSelect({
  value,
  onChange,
  placeholder = "Unassigned",
  className,
  disabled,
}: TeamMemberSelectProps) {
  const { members } = useTeam();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const q = search.toLowerCase();
  const filtered = members
    .filter((m) => m.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 5);

  const handleSelect = (name: string, id: string) => {
    onChange(name, id);
    setOpen(false);
    setSearch("");
  };

  const handleUnassign = () => {
    onChange("", "");
    setOpen(false);
    setSearch("");
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [open]);

  const listContent = (
    <div className="space-y-1">
      <div className="relative px-2 pt-1 pb-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team…"
          className="h-8 pl-8 text-sm bg-secondary border-border"
        />
      </div>
      <button
        onClick={handleUnassign}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/80 transition-colors"
      >
        <UserMinus className="w-3.5 h-3.5" /> Unassigned
      </button>
      {filtered.length === 0 && (
        <p className="px-3 py-3 text-sm text-muted-foreground text-center">No matches</p>
      )}
      {filtered.map((m) => (
        <button
          key={m.id}
          onClick={() => handleSelect(m.name, m.id)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-secondary/80 transition-colors",
            value === m.name && "bg-primary/10"
          )}
        >
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-foreground shrink-0">
            {m.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0">
            <span className="text-sm text-foreground block truncate">{m.name}</span>
            {m.role && <span className="text-[10px] text-muted-foreground block truncate">{m.role}</span>}
          </div>
        </button>
      ))}
    </div>
  );

  const triggerDisplay = (
    <span
      className={cn(
        "text-sm cursor-pointer",
        value ? "text-foreground" : "text-muted-foreground/60 italic",
        !disabled && "hover:bg-secondary/60 px-1 -mx-1 py-0.5 rounded transition-colors",
        className,
      )}
    >
      {value || placeholder}
    </span>
  );

  if (disabled) return triggerDisplay;

  if (isMobile) {
    return (
      <>
        <span onClick={() => setOpen(true)}>{triggerDisplay}</span>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-sm">Assign Team Member</DrawerTitle>
            </DrawerHeader>
            <div className="pb-6 max-h-[60vh] overflow-y-auto">
              {listContent}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="text-left">
          {triggerDisplay}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1 bg-popover border-border" align="start" sideOffset={4}>
        {listContent}
      </PopoverContent>
    </Popover>
  );
}
