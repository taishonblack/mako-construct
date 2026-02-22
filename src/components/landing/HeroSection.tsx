import { motion } from "framer-motion";

const StructuralGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Horizontal lines */}
    {[20, 40, 60, 80].map((top, i) => (
      <motion.div
        key={`h-${i}`}
        className="absolute left-0 right-0 h-px bg-border/30"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, delay: 0.3 * i, ease: [0.22, 1, 0.36, 1] }}
        style={{ top: `${top}%`, transformOrigin: "left" }}
      />
    ))}
    {/* Vertical lines */}
    {[25, 50, 75].map((left, i) => (
      <motion.div
        key={`v-${i}`}
        className="absolute top-0 bottom-0 w-px bg-border/20"
        style={{ left: `${left}%`, transformOrigin: "top" }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 2.5, delay: 0.5 + 0.2 * i, ease: [0.22, 1, 0.36, 1] }}
      />
    ))}
    {/* Intersection nodes */}
    {[
      [25, 20], [50, 40], [75, 60], [25, 60], [75, 40],
    ].map(([left, top], i) => (
      <motion.div
        key={`node-${i}`}
        className="absolute w-2 h-2 rounded-full bg-crimson/60"
        style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.5 + 0.15 * i }}
      />
    ))}
    {/* Red glow accent */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-electric-red/[0.03] blur-[100px]" />
  </div>
);

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <StructuralGrid />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6"
        >
          <span className="font-mono text-sm tracking-[0.3em] uppercase text-muted-foreground">
            MAKO Broadcast Systems
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="font-mono text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
        >
          <span className="text-foreground">Construct</span>
          <br />
          <span className="text-gradient-crimson">the Broadcast</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          A digital operations binder built for live sports infrastructure.
          <br className="hidden md:block" />
          Signal management. Encoder mapping. Operational coordination.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="flex items-center justify-center gap-6"
        >
          <a
            href="/binders"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-mono text-sm tracking-wider uppercase rounded-sm hover:glow-red transition-all duration-300"
          >
            Enter System
          </a>
          <a
            href="#blueprint"
            className="inline-flex items-center gap-2 px-8 py-3 border border-border text-muted-foreground font-mono text-sm tracking-wider uppercase rounded-sm hover:border-crimson hover:text-foreground transition-all duration-300"
          >
            See How It Works
          </a>
        </motion.div>

        {/* MAKO Live wordmark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 2 }}
          className="mt-24 flex items-center justify-center gap-3"
        >
          <div className="w-8 h-px bg-crimson/60" />
          <span className="font-mono text-xs tracking-[0.4em] uppercase text-muted-foreground">
            MAKO Live
          </span>
          <div className="w-8 h-px bg-crimson/60" />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
