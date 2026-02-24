import { LayoutGrid, CheckSquare, Plus, Route, MoreHorizontal } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Binders", icon: LayoutGrid, to: "/binders" },
  { label: "Checklist", icon: CheckSquare, to: "/checklist" },
  { label: "Create", icon: Plus, to: "/binders/new", isCenter: true },
  { label: "Routes", icon: Route, to: "/routes" },
  { label: "More", icon: MoreHorizontal, to: "/more" },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/90 backdrop-blur-xl safe-bottom">
      <div className="flex items-end justify-around h-16 px-1">
        {tabs.map((tab) => {
          const active = tab.to === "/binders"
            ? pathname === "/binders" || (pathname.startsWith("/binders/") && pathname !== "/binders/new")
            : pathname.startsWith(tab.to);

          if (tab.isCenter) {
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className="flex flex-col items-center justify-center -mt-3"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Plus className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-[9px] tracking-wider uppercase mt-0.5 text-muted-foreground">
                  New
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center justify-center gap-0.5 py-2 min-w-[56px]"
            >
              <tab.icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[9px] tracking-wider uppercase transition-colors",
                  active ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
