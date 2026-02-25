import { supabase } from "@/integrations/supabase/client";

const SEED_WIKI_ARTICLES = [
  {
    title: "SRT Transport — Packet Loss Troubleshooting",
    category: "field_solves",
    article_type: "solve",
    tags: ["SRT", "transport", "packet-loss", "Haivision", "Makito X4"],
    description: "Step-by-step guide to diagnose and resolve SRT packet loss on live contribution feeds.",
    structured_content: {
      problem: "SRT stream showing elevated packet loss (>0.5%) during live contribution, causing decoder glitches.",
      symptoms: "Intermittent video artifacts on decoder output. SRT stats show retransmitted packets > 1% of total. Latency spikes on transport dashboard.",
      rootCause: "Most commonly caused by: (1) Insufficient SRT latency buffer for the network path, (2) MTU mismatch between encoder and network, (3) Firewall blocking retransmit packets on non-standard ports.",
      fixSteps: [
        "Check SRT stats on encoder — note RTT and retransmit ratio",
        "Increase SRT latency to 4x measured RTT (minimum 120ms for cross-country)",
        "Verify MTU setting matches network path (default 1500, reduce to 1316 if traversing VPN)",
        "Confirm firewall rules allow UDP on both source and return ports",
        "Run iperf3 UDP test on the same path to baseline network quality",
        "If loss persists, switch to backup transport and escalate to NOC",
      ],
      verification: "SRT retransmit ratio drops below 0.1%. Decoder output clean for 10+ minutes. No artifacts visible on monitor wall.",
      notes: "This solve was created after the NYR @ BOS game where TX 3.1 showed 2.3% packet loss traced to an MTU mismatch on the venue's new fiber gateway.",
    },
  },
  {
    title: "TD Garden — Venue Fiber Patch Guide",
    category: "drawings_diagrams",
    article_type: "diagram",
    tags: ["TD Garden", "Boston", "fiber", "venue", "patch"],
    description: "Fiber patch panel locations and pair assignments for TD Garden broadcast compound.",
    structured_content: {
      blocks: [
        {
          heading: "Broadcast Compound — Fiber Room B2",
          items: [
            "Panel A (12 pairs) — Truck positions 1–3, labeled TP-A01 through TP-A12",
            "Panel B (12 pairs) — Camera positions, labeled CAM-B01 through CAM-B12",
            "Panel C (6 pairs) — Spare / uplink, labeled SPR-C01 through SPR-C06",
          ],
        },
        {
          heading: "Arena Floor Access Points",
          items: [
            "Section 101 (behind home bench) — 2 pairs, connector type: LC",
            "Section 117 (center ice, slash left) — 2 pairs, connector type: LC",
            "Section 119 (center ice, slash right) — 2 pairs, connector type: LC",
            "Catwalk Level — 4 pairs available at junction box JB-CAT-1",
          ],
        },
        {
          heading: "Contact",
          items: ["Pat Sullivan — Venue Tech — pat.sullivan@tdgarden.com — +1-617-555-0301"],
        },
      ],
    },
  },
  {
    title: "NHL Standard — ISO Naming Convention",
    category: "naming_conventions",
    article_type: "standard",
    tags: ["NHL", "ISO", "naming", "standard"],
    description: "Approved ISO naming convention for all NHL broadcast productions.",
    structured_content: {
      blocks: [
        {
          heading: "Production Alias Format",
          items: [
            "Format: ISO-{N} {Position} — e.g. ISO-1 Center, ISO-2 Slash L",
            "Numbers 1–8: Primary game cameras",
            "Numbers 9–16: Secondary / specialty cameras",
            "Numbers 17+: Beauty, tunnel, fan cams",
          ],
        },
        {
          heading: "Engineering Name Format",
          items: [
            "Format: {Brand} {Unit}.{Port} — e.g. Haivision 1.1",
            "Must match encoder physical labeling",
          ],
        },
        {
          heading: "TX/RX Name Format",
          items: [
            "TX: TX-ENC{NN}-IN{NN} — e.g. TX-ENC01-IN01",
            "RX: RX-CR{NN}-DEC{NN}-OUT{NN} — e.g. RX-CR23-DEC01-OUT01",
          ],
        },
      ],
    },
  },
  {
    title: "Makito X4 — Encoder Firmware Update Procedure",
    category: "encoder_standards",
    article_type: "vendor_procedure",
    tags: ["Haivision", "Makito X4", "firmware", "encoder"],
    description: "Standard procedure for updating Haivision Makito X4 encoder firmware in the field.",
    structured_content: {
      steps: [
        { title: "Pre-check", description: "Verify current firmware version via web UI. Document all stream configurations. Ensure backup encoder is available." },
        { title: "Download firmware", description: "Get approved firmware from Haivision portal (currently v4.2.1 for NHL productions). Verify SHA-256 checksum." },
        { title: "Schedule window", description: "Firmware update requires 5-minute reboot. Only perform during non-live windows. Notify TD and producer." },
        { title: "Upload and install", description: "Access encoder web UI → System → Firmware → Upload. Do NOT power cycle during installation." },
        { title: "Verify", description: "Confirm new version in System → About. Re-test all stream outputs. Verify SRT stats are nominal." },
        { title: "Rollback plan", description: "If issues occur, previous firmware is retained in backup partition. System → Firmware → Revert." },
      ],
    },
  },
  {
    title: "Post-Mortem: SEA @ VAN — Encoder Failover Incident",
    category: "field_solves",
    article_type: "post_mortem",
    tags: ["post-mortem", "encoder", "failover", "Stadium Series"],
    description: "Analysis of encoder failover event during SEA @ VAN Stadium Series game at BC Place.",
    structured_content: {
      problem: "ENC-03 lost power during 2nd period, causing 47-second gap on ISO-3 before manual failover to backup.",
      symptoms: "Decoder output showed black for ISO-3. No SRT stats from ENC-03. Backup encoder was not auto-switching.",
      rootCause: "Power strip in broadcast compound tripped due to overloaded circuit. Auto-failover was not configured on this particular encoder pair.",
      fixSteps: [
        "Immediate: Manually switched to backup encoder ENC-03B within 47 seconds",
        "Root cause: Identified shared power circuit with lighting rig — separated circuits",
        "Prevention: Added auto-failover configuration to all encoder pairs in standard build template",
        "Added UPS requirement to pre-show checklist for all encoder positions",
      ],
      verification: "Tested auto-failover on all 6 encoder pairs — switchover time < 3 seconds. Added to standard checklist.",
      notes: "This incident led to the addition of 'Verify encoder failover config' as a mandatory checklist item.",
    },
  },
];

let seeded = false;

export async function seedWikiIfEmpty() {
  if (seeded) return;
  seeded = true;

  const { data: existing } = await supabase
    .from("wiki_articles")
    .select("id")
    .limit(1);

  if (existing && existing.length > 0) return;

  for (const article of SEED_WIKI_ARTICLES) {
    await supabase.from("wiki_articles").insert({
      title: article.title,
      category: article.category,
      article_type: article.article_type,
      tags: article.tags,
      description: article.description,
      structured_content: article.structured_content as any,
      attachments: [],
      created_by: "System",
      updated_by: "System",
      version: 1,
    } as any);
  }
}
