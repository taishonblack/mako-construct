import {
  LayoutGrid,
  Settings,
  Plus,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Binder Library", url: "/binders", icon: LayoutGrid },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarContent>
        {/* Brand */}
        <div className="px-4 py-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-crimson" />
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-crimson">
              MAKO Live
            </span>
          </div>
        </div>

        {/* New Binder action */}
        <div className="px-3 pt-4 pb-2">
          <a
            href="/binders/new"
            className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium tracking-wide uppercase text-primary-foreground bg-primary rounded-md hover:glow-red transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5" />
            New Binder
          </a>
        </div>

        {/* Nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-secondary hover:text-foreground transition-colors"
                      activeClassName="bg-secondary text-foreground border-l-2 border-crimson"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-secondary hover:text-foreground transition-colors"
          activeClassName="bg-secondary text-foreground"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
}
