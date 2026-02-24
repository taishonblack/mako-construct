import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { MakoFinMark } from "@/components/MakoFinMark";

interface MobileHeaderProps {
  onSearchClick: () => void;
}

export function MobileHeader({ onSearchClick }: MobileHeaderProps) {
  return (
    <header className="h-12 flex items-center justify-between border-b border-border/60 bg-card/90 backdrop-blur-xl px-4 sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-2 group">
        <MakoFinMark size={18} className="text-primary transition-colors group-hover:text-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-foreground">
          MAKO LIVE
        </span>
      </Link>
      <button
        onClick={onSearchClick}
        className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
      </button>
    </header>
  );
}
