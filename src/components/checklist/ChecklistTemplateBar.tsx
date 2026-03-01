import { useState } from "react";
import { Save, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useChecklistTemplates, checklistTemplateStore, type ChecklistTemplateItem } from "@/stores/checklist-template-store";
import type { ChecklistItem } from "@/hooks/use-binder-state";

interface Props {
  items: ChecklistItem[];
  onLoadItems: (items: ChecklistTemplateItem[]) => void;
  readOnly: boolean;
}

export function ChecklistTemplateBar({ items, onLoadItems, readOnly }: Props) {
  const { templates, refresh } = useChecklistTemplates();
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [saveName, setSaveName] = useState("");

  const handleSave = async () => {
    if (!saveName.trim() || items.length === 0) return;
    const templateItems: ChecklistTemplateItem[] = items.map((i) => ({
      label: i.label,
      assignedTo: i.assignedTo,
      notes: i.notes,
    }));
    const result = await checklistTemplateStore.create(saveName.trim(), templateItems);
    if (result) {
      toast.success(`Template "${saveName.trim()}" saved with ${items.length} items`);
      setSaveName("");
      setShowSave(false);
      refresh();
    } else {
      toast.error("Failed to save template");
    }
  };

  const handleLoad = (tpl: { items: ChecklistTemplateItem[]; name: string }) => {
    onLoadItems(tpl.items);
    toast.success(`Loaded ${tpl.items.length} items from "${tpl.name}"`);
    setShowLoad(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await checklistTemplateStore.delete(id);
    if (ok) {
      toast.success(`Deleted template "${name}"`);
      refresh();
    }
  };

  if (readOnly) return null;

  return (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      {/* Save as template */}
      {!showSave ? (
        <Button variant="outline" size="sm" onClick={() => setShowSave(true)}
          disabled={items.length === 0}
          className="h-7 text-[10px] tracking-wider uppercase gap-1">
          <Save className="w-3 h-3" /> Save as Template
        </Button>
      ) : (
        <div className="flex items-center gap-2 p-2 bg-secondary/50 border border-border rounded-sm">
          <Input value={saveName} onChange={(e) => setSaveName(e.target.value)}
            placeholder="Template name…" className="h-7 text-xs w-48"
            onKeyDown={(e) => e.key === "Enter" && handleSave()} autoFocus />
          <Button size="sm" onClick={handleSave} disabled={!saveName.trim()}
            className="h-7 text-[10px] tracking-wider uppercase">Save</Button>
          <Button variant="ghost" size="sm" onClick={() => { setShowSave(false); setSaveName(""); }}
            className="h-7 text-[10px] tracking-wider uppercase text-muted-foreground">Cancel</Button>
        </div>
      )}

      {/* Load template */}
      <div className="relative">
        <Button variant="outline" size="sm" onClick={() => { setShowLoad(!showLoad); refresh(); }}
          className="h-7 text-[10px] tracking-wider uppercase gap-1">
          <FolderOpen className="w-3 h-3" /> Load Template
        </Button>
        {showLoad && (
          <div className="absolute z-30 top-full mt-1 left-0 bg-secondary border border-border rounded-sm shadow-lg py-1 min-w-[220px]">
            {templates.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No saved templates.</p>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 group">
                  <button onClick={() => handleLoad(tpl)}
                    className="text-xs text-foreground hover:text-primary transition-colors text-left flex-1">
                    {tpl.name}
                    <span className="text-[10px] text-muted-foreground ml-2">({tpl.items.length} items)</span>
                  </button>
                  <button onClick={() => handleDelete(tpl.id, tpl.name)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5 ml-2">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
