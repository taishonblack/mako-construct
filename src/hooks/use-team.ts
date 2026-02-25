import { useState, useEffect, useCallback } from "react";
import { teamStore, type TeamMember } from "@/stores/team-store";

export type { TeamMember };

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await teamStore.getAll();
    setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addMember = useCallback(async (data: Omit<TeamMember, "id">) => {
    await teamStore.create(data);
    refresh();
  }, [refresh]);

  const updateMember = useCallback(async (id: string, partial: Partial<TeamMember>) => {
    await teamStore.update(id, partial);
    refresh();
  }, [refresh]);

  const removeMember = useCallback(async (id: string) => {
    await teamStore.remove(id);
    refresh();
  }, [refresh]);

  return { members, loading, addMember, updateMember, removeMember };
}
