import { useState, useEffect, useCallback } from "react";
import { templateStore, type BinderTemplate } from "@/stores/template-store";

export type { BinderTemplate };

export function useTemplates() {
  const [templates, setTemplates] = useState<BinderTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await templateStore.getAll();
    setTemplates(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { templates, loading, refresh };
}
