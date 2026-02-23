import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const dataFlowItems = [
  { label: "Primers & Call Sheets", desc: "Ingested documents are parsed into structured signal data, contacts, and schedules." },
  { label: "Signal Mapping", desc: "ISO feeds are mapped to encoder inputs and decoder outputs with automatic allocation." },
  { label: "Transport Profiles", desc: "Primary and backup transport paths defined with SRT, MPEG-TS, and return feed configuration." },
  { label: "Operational Coordination", desc: "Contacts, comms, and schedules organized by location and role for instant access." },
];

export function AssemblySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 overflow-hidden" ref={ref}>
      {/* Subtle grid background */}
      <div className="absolute inset-0 grid-lines opacity-30" />

      <div className="relative w-full px-8 md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-crimson mb-4 block">
            Assembly
          </span>
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-foreground mb-4">
            Data Flows Into Structure
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From unstructured documents and messages to a fully mapped operational binder.
          </p>
        </motion.div>

        <div className="relative">
          {/* Central vertical line */}
          <motion.div
            className="absolute left-1/2 top-0 bottom-0 w-px bg-border/40 -translate-x-1/2"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top" }}
          />

          <div className="space-y-16">
            {dataFlowItems.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={item.label}
                  className={`flex items-center gap-8 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.2 }}
                >
                  <div className={`flex-1 ${isLeft ? "md:text-right" : "md:text-left"}`}>
                    <h3 className="font-mono text-lg font-semibold text-foreground mb-2">{item.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>

                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-4 h-4 rounded-full border-2 border-crimson bg-background" />
                    <div className="absolute inset-0 w-4 h-4 rounded-full bg-electric-red/20 animate-glow-pulse" />
                  </div>

                  <div className="flex-1" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
