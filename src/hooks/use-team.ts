import { useSyncExternalStore, useCallback } from "react";
import { teamStore, type TeamMember } from "@/stores/team-store";

export function useTeam() {
  const members = useSyncExternalStore(
    teamStore.subscribe,
    teamStore.getAll,
    teamStore.getAll,
  );

  const addMember = useCallback((data: Omit<TeamMember, "id">) => {
    return teamStore.create(data);
  }, []);

  const updateMember = useCallback((id: string, partial: Partial<TeamMember>) => {
    return teamStore.update(id, partial);
  }, []);

  const removeMember = useCallback((id: string) => {
    return teamStore.remove(id);
  }, []);

  return { members, addMember, updateMember, removeMember };
}
