import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import { MakoFinMark } from "@/components/MakoFinMark";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.7, delay, ease: "easeOut" as const },
});

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />

      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)"
      }} />

      {/* Content */}
      <div className="relative z-10 w-full px-8 md:px-16 lg:px-24">
        {/* Brand label */}
        <motion.div {...fadeUp(0.2)} className="mb-6 flex items-center gap-2">
          <MakoFinMark size={22} className="text-crimson" />
          <span className="text-xs font-semibold tracking-[0.35em] uppercase text-crimson">MAKO</span>
        </motion.div>

        {/* Tagline */}
        <motion.h1
          {...fadeUp(0.4)}
          className="text-2xl md:text-4xl font-light tracking-tight text-foreground leading-[1.15] mb-8 max-w-xl"
        >
          Live Production Binder
          <br />
          Built for Broadcast Execution
        </motion.h1>

        {/* Manifesto lines */}
        <motion.div {...fadeUp(0.6)} className="mb-10 space-y-1">
          <p className="text-sm md:text-base text-muted-foreground font-light">Pull once.</p>
          <p className="text-sm md:text-base text-muted-foreground font-light">Align everyone.</p>
          <p className="text-sm md:text-base text-muted-foreground font-light">Go live with confidence.</p>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(0.8)}>
          <a
            href="/binders"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-primary hover:glow-red text-primary-foreground text-base font-medium rounded-md transition-all duration-300"
          >
            Open a Binder
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Problem / Purpose / Intent */}
        <div className="mt-24 space-y-12 max-w-lg">
          {[
            { label: "The Problem", text: "Live broadcasts aren't one team. They're many.\nDecisions happen across calls, emails, and Slack — and then disappear." },
            { label: "The Purpose", text: "MAKO Live creates a shared binder around every show:\nschedule, contacts, signals, transport, changes, issues — all in one place." },
            { label: "The Intent", text: "No extra noise. No busywork.\nJust operational truth — for the people building the show." },
          ].map((block, i) => (
            <motion.div
              key={block.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="text-[10px] font-medium tracking-[0.25em] uppercase text-crimson mb-3">
                {block.label}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light whitespace-pre-line">
                {block.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
