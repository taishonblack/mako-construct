import { useState, useEffect } from "react";
import {
  LayoutGrid,
  Settings,
  Plus,
  Calendar,
  BookOpen,
  Route,
  CheckSquare,
  Users,
  LogIn,
  LogOut,
  User,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { MakoFinMark } from "@/components/MakoFinMark";
import { Link } from "react-router-dom";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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

const publicNavItems = [
  { title: "Binders", url: "/binders", icon: LayoutGrid },
  { title: "Quinn", url: "/quinn", icon: Sparkles },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Checklist", url: "/checklist", icon: CheckSquare },
  { title: "Routes", url: "/routes", icon: Route },
  { title: "Wiki", url: "/wiki", icon: BookOpen },
];

const authNavItems = [
  { title: "Staff", url: "/staff", icon: Users },
];

export function AppSidebar() {
  const auth = useOptionalAuth();
  const isLoggedIn = !!auth?.user;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth?.user) { setIsAdmin(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [auth?.user]);

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
            New Binder
          </Link>
        </div>

        {/* Nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[...publicNavItems, ...(isLoggedIn ? authNavItems : [])].map((item) => (
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

      <SidebarFooter className="border-t border-border p-3 space-y-1">
        {isLoggedIn ? (
          <>
            <NavLink
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-secondary hover:text-foreground transition-colors"
              activeClassName="bg-secondary text-foreground"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </NavLink>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                {isAdmin ? (
                  <ShieldCheck className="w-3 h-3 text-crimson" />
                ) : (
                  <User className="w-3 h-3 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-foreground truncate block">
                  {auth?.profile?.display_name || auth?.user?.email}
                </span>
                {isAdmin && (
                  <span className="text-[9px] tracking-[0.15em] uppercase text-crimson font-medium">
                    Admin
                  </span>
                )}
              </div>
              <button onClick={() => auth?.signOut()} title="Sign out"
                className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <Link to="/login"
            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-secondary hover:text-foreground transition-colors">
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
