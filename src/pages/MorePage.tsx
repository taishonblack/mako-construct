import { Calendar, BookOpen, Settings, Users, Sparkles, Route, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
  { label: "Quinn", icon: Sparkles, to: "/quinn" },
  { label: "Calendar", icon: Calendar, to: "/calendar" },
  { label: "Checklist", icon: CheckSquare, to: "/checklist" },
  { label: "Routes", icon: Route, to: "/routes" },
  { label: "Staff", icon: Users, to: "/staff" },
  { label: "Wiki", icon: BookOpen, to: "/wiki" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

export default function MorePage() {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="text-xl font-medium text-foreground tracking-tight">More</h1>
      </motion.div>
      <div className="space-y-1">
        {links.map((item, i) => (
          <motion.div key={item.to} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
            <Link
              to={item.to}
              className="flex items-center gap-4 px-4 py-3.5 rounded-md text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span>{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
