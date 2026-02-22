import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function InfrastructureSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32" ref={ref}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-crimson mb-4 block">
            Infrastructure
          </span>
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-foreground mb-6">
            Part of the MAKO Ecosystem
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed">
            MAKO Live sits alongside MAKO QC in a family of broadcast infrastructure products. 
            Where QC observes signal integrity, Live constructs the operational framework.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="steel-panel p-8 text-left border-l-2 border-l-blue-500/50"
          >
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-blue-400 mb-3 block">
              MAKO QC
            </span>
            <h3 className="font-mono text-xl font-semibold text-foreground mb-2">Observe</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Signal rail system. Monitoring, feed diagnostics, and visibility across the broadcast chain.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="steel-panel p-8 text-left border-l-2 border-l-crimson"
          >
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-crimson mb-3 block">
              MAKO Live
            </span>
            <h3 className="font-mono text-xl font-semibold text-foreground mb-2">Construct</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Steel framework. Operational build, structural assembly, and execution under pressure.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-32 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-px bg-crimson/40" />
          <span className="font-mono text-sm tracking-[0.3em] uppercase text-foreground">
            MAKO Live
          </span>
          <div className="w-12 h-px bg-crimson/40" />
        </div>
        <p className="font-mono text-xs text-muted-foreground tracking-wider">
          MAKO Broadcast Systems &middot; Construct the Broadcast
        </p>
      </motion.div>
    </section>
  );
}
