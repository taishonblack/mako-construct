import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

function AnimatedLine({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ scaleX: 0 }}
      animate={isInView ? { scaleX: 1 } : {}}
      transition={{ duration: 1.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: "left" }}
    />
  );
}

export function BlueprintSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="blueprint" className="relative py-32 overflow-hidden" ref={ref}>
      <div className="w-full px-8 md:px-16 lg:px-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: Blueprint wireframe visual */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1 }}
            className="relative aspect-square"
          >
            <div className="absolute inset-4 border border-border/40 rounded-sm">
              {/* Wireframe structure */}
              <AnimatedLine className="absolute top-1/4 left-0 right-0 h-px bg-border/50" delay={0.3} />
              <AnimatedLine className="absolute top-1/2 left-0 right-0 h-px bg-border/50" delay={0.5} />
              <AnimatedLine className="absolute top-3/4 left-0 right-0 h-px bg-border/50" delay={0.7} />
              
              {/* Vertical structural lines */}
              <motion.div
                className="absolute left-1/3 top-0 bottom-0 w-px bg-border/40"
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{ duration: 1.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "top" }}
              />
              <motion.div
                className="absolute left-2/3 top-0 bottom-0 w-px bg-border/40"
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{ duration: 1.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "top" }}
              />

              {/* Crimson accent nodes */}
              {[
                { x: "33%", y: "25%" },
                { x: "66%", y: "50%" },
                { x: "33%", y: "75%" },
              ].map((pos, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full border-2 border-crimson bg-background"
                  style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 1 + 0.2 * i }}
                />
              ))}

              {/* Label blocks */}
              <motion.div
                className="absolute top-[12%] left-[8%] font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.2 }}
              >
                Signals
              </motion.div>
              <motion.div
                className="absolute top-[37%] left-[8%] font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.4 }}
              >
                Transport
              </motion.div>
              <motion.div
                className="absolute top-[62%] left-[8%] font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.6 }}
              >
                Contacts
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-crimson mb-4 block">
                Blueprint
              </span>
              <h2 className="font-mono text-3xl md:text-4xl font-bold text-foreground mb-6">
                The Digital Binder
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Every live production event generates a binder — a structured collection of signals,
                contacts, schedules, transport configurations, and operational decisions. MAKO Live
                replaces scattered spreadsheets and email chains with a single, engineered source of truth.
              </p>
              <div className="space-y-3">
                {["Signal & ISO management", "Encoder/decoder mapping", "Transport configurations", "Change tracking & issues"].map((item, i) => (
                  <motion.div
                    key={item}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-crimson" />
                    <span className="font-mono text-sm text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
