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
          "w-5 h-[2px] rounded-full transition-all duration-300",
          fault
            ? "bg-destructive"
            : trace
              ? "glow-trace-connector"
              : "bg-border"
        )}
      />
      <ChevronRight
        className={cn(
          "w-3 h-3 -ml-1.5 transition-colors duration-300",
          fault ? "text-destructive" : trace ? "text-primary" : "text-muted-foreground/40"
        )}
      />
    </div>
  );
}
