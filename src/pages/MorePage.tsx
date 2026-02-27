import { Calendar, BookOpen, Users, Sparkles, Route, CheckSquare, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useOptionalAuth } from "@/contexts/AuthContext";

const links = [
  { label: "Quinn", icon: Sparkles, to: "/quinn" },
  { label: "Calendar", icon: Calendar, to: "/calendar" },
  { label: "Checklist", icon: CheckSquare, to: "/checklist" },
  { label: "Routes", icon: Route, to: "/routes" },
  { label: "Staff", icon: Users, to: "/staff", authRequired: true },
  { label: "Wiki", icon: BookOpen, to: "/wiki" },
];

export default function MorePage() {
  const auth = useOptionalAuth();
  const isLoggedIn = !!auth?.user;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="text-xl font-medium text-foreground tracking-tight">More</h1>
      </motion.div>
      <div className="space-y-1">
        {links.map((item, i) => {
          const dest = (item as any).authRequired && !isLoggedIn ? "/login" : item.to;
          return (
            <motion.div key={item.to} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
              <Link
                to={dest}
                state={(item as any).authRequired && !isLoggedIn ? { from: item.to } : undefined}
                className="flex items-center gap-4 px-4 py-3.5 rounded-md text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                {(item as any).authRequired && !isLoggedIn && <LogIn className="w-4 h-4 text-muted-foreground" />}
              </Link>
            </motion.div>
          );
        })}

        {/* Sign In / Sign Out */}
        {!isLoggedIn ? (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: links.length * 0.04 }}>
            <Link to="/login" className="flex items-center gap-4 px-4 py-3.5 rounded-md text-sm text-primary hover:bg-secondary transition-colors">
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: links.length * 0.04 }}>
            <button onClick={() => auth?.signOut()} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-md text-sm text-muted-foreground hover:bg-secondary transition-colors text-left">
              <LogIn className="w-5 h-5 rotate-180" />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
