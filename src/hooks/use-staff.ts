import { useState, useEffect, useCallback } from "react";
import { staffStore, type StaffMember } from "@/stores/staff-store";

export type { StaffMember };

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await staffStore.getAll();
    setStaff(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { staff, loading, refresh };
}
