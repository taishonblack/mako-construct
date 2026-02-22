import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, GitBranch, AlertTriangle } from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Change Tracking",
    desc: "Every modification is logged with source, timestamp, and confirmation status. Proposed changes surface in red until confirmed.",
  },
  {
    icon: Shield,
    title: "Operational Integrity",
    desc: "Role-based access, structured data validation, and version-controlled document management protect operational continuity.",
  },
  {
    icon: AlertTriangle,
    title: "Issue Management",
    desc: "Open issues surface immediately with owner assignment and status tracking. Nothing falls through the cracks on game day.",
  },
];

export function ReinforcementSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-crimson mb-4 block">
            Reinforcement
          </span>
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built to Withstand Pressure
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Live production doesn't allow for mistakes. Every layer is designed for reliability.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="steel-panel p-8 hover:border-glow-red transition-all duration-500 group"
            >
              <feat.icon className="w-6 h-6 text-crimson mb-5 group-hover:text-electric-red transition-colors" />
              <h3 className="font-mono text-lg font-semibold text-foreground mb-3">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
