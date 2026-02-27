/**
 * Centralized mutation service layer.
 * All writes go through here to ensure binder_activity logging.
 */
import { binderStore, type BinderRecord } from "@/stores/binder-store";
import { activityStore } from "@/stores/activity-store";

type ActorInfo = {
  actorType: "user" | "quinn" | "system";
  actorName: string;
  source: "ui" | "chat" | "import" | "api";
};

const DEFAULT_ACTOR: ActorInfo = { actorType: "user", actorName: "User", source: "ui" };

export const activityService = {
  /** Update binder with automatic before/after logging */
  async updateBinder(
    id: string,
    patch: Partial<BinderRecord>,
    actor: ActorInfo = DEFAULT_ACTOR
  ): Promise<BinderRecord | null> {
    // Read before
    const before = await binderStore.getById(id);
    if (!before) return null;

    // Write
    const after = await binderStore.update(id, patch);
    if (!after) return null;

    // Determine what changed
    const fieldsChanged: string[] = [];
    const beforeVals: Record<string, any> = {};
    const afterVals: Record<string, any> = {};

    for (const key of Object.keys(patch)) {
      if ((before as any)[key] !== (after as any)[key]) {
        fieldsChanged.push(key);
        beforeVals[key] = (before as any)[key];
        afterVals[key] = (after as any)[key];
      }
    }

    if (fieldsChanged.length > 0) {
      const summary = fieldsChanged.length === 1
        ? `Updated ${fieldsChanged[0]}: ${beforeVals[fieldsChanged[0]]} → ${afterVals[fieldsChanged[0]]}`
        : `Updated ${fieldsChanged.length} fields (${fieldsChanged.join(", ")})`;

      await activityStore.log({
        binder_id: id,
        actor_type: actor.actorType,
        actor_name: actor.actorName,
        action_type: "binder_update",
        target: "binder",
        target_id: id,
        summary,
        details: { fields_changed: fieldsChanged, before: beforeVals, after: afterVals },
        confidence: null,
        source: actor.source,
        undo_token: null,
        is_confirmed: true,
      });
    }

    return after;
  },

  /** Log a route change */
  async logRouteChange(
    action: "route_create" | "route_update" | "route_delete",
    routeId: string,
    summary: string,
    details: Record<string, any> = {},
    binderId?: string,
    actor: ActorInfo = DEFAULT_ACTOR
  ): Promise<void> {
    await activityStore.log({
      binder_id: binderId || null,
      actor_type: actor.actorType,
      actor_name: actor.actorName,
      action_type: action,
      target: "route",
      target_id: routeId,
      summary,
      details,
      confidence: null,
      source: actor.source,
      undo_token: null,
      is_confirmed: true,
    });
  },

  /** Log a receiver reassignment */
  async logRxReassignment(
    routeId: string,
    isoNumber: number,
    oldRx: string,
    newRx: string,
    actor: ActorInfo = DEFAULT_ACTOR
  ): Promise<void> {
    await activityStore.log({
      binder_id: null,
      actor_type: actor.actorType,
      actor_name: actor.actorName,
      action_type: "route_update",
      target: "route",
      target_id: routeId,
      summary: `ISO ${isoNumber} RX: ${oldRx} → ${newRx}`,
      details: { iso_number: isoNumber, before: { receiver: oldRx }, after: { receiver: newRx } },
      confidence: null,
      source: actor.source,
      undo_token: null,
      is_confirmed: true,
    });
  },

  /** Log a hop change */
  async logHopChange(
    action: "hop_add" | "hop_remove" | "hop_rename" | "hop_reorder",
    routeId: string,
    summary: string,
    details: Record<string, any> = {},
    actor: ActorInfo = DEFAULT_ACTOR
  ): Promise<void> {
    await activityStore.log({
      binder_id: null,
      actor_type: actor.actorType,
      actor_name: actor.actorName,
      action_type: action,
      target: "hop",
      target_id: routeId,
      summary,
      details,
      confidence: null,
      source: actor.source,
      undo_token: null,
      is_confirmed: true,
    });
  },

  /** Log checklist changes */
  async logChecklistChange(
    action: "checklist_add" | "checklist_update" | "checklist_complete",
    binderId: string,
    summary: string,
    details: Record<string, any> = {},
    actor: ActorInfo = DEFAULT_ACTOR
  ): Promise<void> {
    await activityStore.log({
      binder_id: binderId,
      actor_type: actor.actorType,
      actor_name: actor.actorName,
      action_type: action,
      target: "checklist",
      target_id: binderId,
      summary,
      details,
      confidence: null,
      source: actor.source,
      undo_token: null,
      is_confirmed: true,
    });
  },

  /** Log staff assignment */
  async logStaffAssign(
    binderId: string,
    summary: string,
    details: Record<string, any> = {},
    actor: ActorInfo = DEFAULT_ACTOR
  ): Promise<void> {
    await activityStore.log({
      binder_id: binderId,
      actor_type: actor.actorType,
      actor_name: actor.actorName,
      action_type: "staff_assign",
      target: "staff",
      target_id: binderId,
      summary,
      details,
      confidence: null,
      source: actor.source,
      undo_token: null,
      is_confirmed: true,
    });
  },

  /** Log document upload */
  async logDocumentUpload(
    binderId: string,
    filename: string,
    actor: ActorInfo = DEFAULT_ACTOR
  ): Promise<void> {
    await activityStore.log({
      binder_id: binderId,
      actor_type: actor.actorType,
      actor_name: actor.actorName,
      action_type: "document_upload",
      target: "document",
      target_id: binderId,
      summary: `Uploaded document: ${filename}`,
      details: { filename },
      confidence: null,
      source: actor.source,
      undo_token: null,
      is_confirmed: true,
    });
  },

  /** Log admin question */
  async logAdminQuestion(
    question: string,
    binderId?: string,
    actor: ActorInfo = DEFAULT_ACTOR
  ): Promise<void> {
    await activityStore.log({
      binder_id: binderId || null,
      actor_type: actor.actorType,
      actor_name: actor.actorName,
      action_type: "admin_question",
      target: "system",
      target_id: null,
      summary: `Admin question: ${question.slice(0, 100)}`,
      details: { question },
      confidence: null,
      source: actor.source,
      undo_token: null,
      is_confirmed: true,
    });
  },
};
