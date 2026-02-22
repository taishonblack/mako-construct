import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end pb-24 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Gradient overlay — dark from left for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />

      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)"
      }} />

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto w-full px-8 md:px-16">
        {/* Brand label */}
        <div className="mb-6">
          <span className="text-sm font-medium tracking-[0.35em] uppercase text-crimson">
            MAKO
          </span>
          <br />
          <span className="text-sm font-medium tracking-[0.35em] uppercase text-crimson">
            LIVE
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground leading-[1.15] mb-8 max-w-xl">
          Live Production Binder
          <br />
          Built for Broadcast Execution
        </h1>

        {/* Subhead lines */}
        <div className="mb-10 space-y-1">
          <p className="text-base md:text-lg text-muted-foreground font-light">Build once.</p>
          <p className="text-base md:text-lg text-muted-foreground font-light">Align everyone.</p>
          <p className="text-base md:text-lg text-muted-foreground font-light">Go live with confidence.</p>
        </div>

        {/* CTA */}
        <a
          href="/binders"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-primary hover:glow-red text-primary-foreground text-sm font-medium rounded-md transition-all duration-300"
        >
          Open a Binder
          <ArrowRight className="w-4 h-4" />
        </a>

        {/* Problem / Purpose / Intent */}
        <div className="mt-24 space-y-12 max-w-lg">
          <div>
            <h3 className="text-xs font-medium tracking-[0.25em] uppercase text-crimson mb-3">
              The Problem
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              Live broadcasts aren't one team. They're many.
              <br />
              Decisions happen across calls, emails, and Slack — and then disappear.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-[0.25em] uppercase text-crimson mb-3">
              The Purpose
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              MAKO Live creates a shared binder around every show:
              <br />
              schedule, contacts, signals, transport, changes, issues — all in one place.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-[0.25em] uppercase text-crimson mb-3">
              The Intent
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              No extra noise. No busywork.
              <br />
              Just operational truth — for the people building the show.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
