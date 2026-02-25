import { useState, useEffect, useCallback } from "react";
import { binderStore, type BinderRecord, type BinderStatus } from "@/stores/binder-store";

export type { BinderRecord, BinderStatus };

export function useBinders() {
  const [binders, setBinders] = useState<BinderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await binderStore.getAll();
    setBinders(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { binders, loading, refresh };
}

export function useBinder(id: string) {
  const [binder, setBinder] = useState<BinderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    binderStore.getById(id).then((data) => {
      setBinder(data || null);
      setLoading(false);
    });
  }, [id]);

  return { binder, loading };
}
