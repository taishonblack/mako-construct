import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  trace?: boolean;
  fault?: boolean;
}

export function NodeConnector({ trace, fault }: Props) {
  return (
    <div className="flex items-center shrink-0 px-0.5">
      <div
        className={cn(
          "w-4 h-px transition-colors",
          fault ? "bg-destructive" : trace ? "bg-primary/60" : "bg-border"
        )}
      />
      <ChevronRight
        className={cn(
          "w-3 h-3 -ml-1",
          fault ? "text-destructive" : trace ? "text-primary/70" : "text-muted-foreground/40"
        )}
      />
    </div>
  );
}
