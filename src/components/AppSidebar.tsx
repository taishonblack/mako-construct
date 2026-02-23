import {
  LayoutGrid,
  Settings,
  Plus,
  Calendar,
  
  BookOpen,
  BarChart3,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { MakoFinMark } from "@/components/MakoFinMark";
import { Link } from "react-router-dom";
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
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Productions", url: "/containers", icon: LayoutGrid },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Wiki", url: "/wiki", icon: BookOpen },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarContent>
        {/* Brand */}
        <div className="px-4 py-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2 group">
            <MakoFinMark size={18} className="text-crimson group-hover:text-[hsl(var(--electric-red))] group-hover:drop-shadow-[0_0_8px_hsl(var(--electric-red)/0.6)] transition-all duration-300" />
            <span className="text-xs font-semibold tracking-[0.35em] uppercase text-crimson">
              MAKO LIVE
            </span>
          </Link>
        </div>

        {/* New Binder action */}
        <div className="px-3 pt-4 pb-2">
          <Link
            to="/binders/new"
            className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium tracking-wide uppercase text-primary-foreground bg-primary rounded-md hover:glow-red transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5" />
            New Production
          </Link>
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
