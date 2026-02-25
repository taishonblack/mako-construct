// ─── Wiki Types & Constants ─────────────────────────────────

export type WikiCategory =
  | "signal_standards"
  | "encoder_standards"
  | "decoder_topology"
  | "transport_profiles"
  | "comms_standards"
  | "production_protocols"
  | "naming_conventions"
  | "checklist_templates"
  | "field_solves"
  | "drawings_diagrams";

export type WikiArticleType =
  | "solve"
  | "standard"
  | "workflow"
  | "diagram"
  | "vendor_procedure"
  | "post_mortem"
  | "reference";

export interface SolveContent {
  problem: string;
  symptoms: string;
  rootCause: string;
  fixSteps: string[];
  verification: string;
  notes: string;
}

export interface BlockContent {
  blocks: { heading: string; items: string[] }[];
}

export interface WorkflowContent {
  steps: { title: string; description: string }[];
}

export type StructuredContent = SolveContent | BlockContent | WorkflowContent;

export interface WikiArticle {
  id: string;
  title: string;
  category: WikiCategory;
  article_type: WikiArticleType;
  tags: string[];
  description: string;
  structured_content: StructuredContent;
  related_binder_id: string | null;
  related_route_id: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface WikiVersion {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  category: WikiCategory;
  article_type: WikiArticleType;
  tags: string[];
  description: string;
  structured_content: StructuredContent;
  change_summary: string;
  created_by: string;
  created_at: string;
}

export interface WikiLink {
  id: string;
  article_id: string;
  entity_type: string;
  entity_id: string;
  link_type: string;
  created_by: string;
  created_at: string;
}

export const CATEGORY_META: Record<WikiCategory, { label: string; icon: string; description: string }> = {
  signal_standards: { label: "Signal Standards", icon: "Radio", description: "ISO naming, alias conventions, destination mapping" },
  encoder_standards: { label: "Encoder Standards", icon: "Cpu", description: "Approved encoders, input allocation, failover" },
  decoder_topology: { label: "Decoder Topology", icon: "Monitor", description: "Decoder assignment, HQ routing standards" },
  transport_profiles: { label: "Transport Profiles", icon: "Wifi", description: "SRT, MPEG-TS, backup & return feed policies" },
  comms_standards: { label: "Comms Standards", icon: "Headphones", description: "Clear-Com channels, LQ naming, hot mic policies" },
  production_protocols: { label: "Production Protocols", icon: "FileCheck", description: "Release procedures, go/no-go criteria" },
  naming_conventions: { label: "Naming Conventions", icon: "Tag", description: "Standardized naming across binders & configs" },
  checklist_templates: { label: "Checklist Templates", icon: "ClipboardList", description: "Standard checklists that seed new binders" },
  field_solves: { label: "Field Solves", icon: "Wrench", description: "On-site fixes, workarounds, and engineering solutions" },
  drawings_diagrams: { label: "Drawings & Diagrams", icon: "PenTool", description: "Signal diagrams, rack layouts, truck workflows" },
};

export const ARTICLE_TYPE_META: Record<WikiArticleType, { label: string; color: string }> = {
  solve: { label: "Solve / Fix", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  standard: { label: "Standard", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  workflow: { label: "Workflow", color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  diagram: { label: "Diagram", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  vendor_procedure: { label: "Vendor Procedure", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  post_mortem: { label: "Post-Mortem", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  reference: { label: "Reference", color: "bg-secondary text-muted-foreground border-border" },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_META) as WikiCategory[];
export const ALL_ARTICLE_TYPES = Object.keys(ARTICLE_TYPE_META) as WikiArticleType[];

export function emptySolveContent(): SolveContent {
  return { problem: "", symptoms: "", rootCause: "", fixSteps: [""], verification: "", notes: "" };
}

export function emptyBlockContent(): BlockContent {
  return { blocks: [{ heading: "Section 1", items: [""] }] };
}

export function emptyWorkflowContent(): WorkflowContent {
  return { steps: [{ title: "Step 1", description: "" }] };
}

export function defaultContentForType(type: WikiArticleType): StructuredContent {
  if (type === "solve" || type === "post_mortem") return emptySolveContent();
  if (type === "workflow") return emptyWorkflowContent();
  return emptyBlockContent();
}

export function isSolveContent(c: StructuredContent): c is SolveContent {
  return "problem" in c;
}
export function isBlockContent(c: StructuredContent): c is BlockContent {
  return "blocks" in c;
}
export function isWorkflowContent(c: StructuredContent): c is WorkflowContent {
  return "steps" in c;
}
