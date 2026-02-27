/**
 * Scope chooser dialog — "Apply this change to: This binder only | Platform routes | Cancel"
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldLabel: string;
  onBinderOnly: () => void;
  onPlatform: () => void;
}

export function ScopeChooser({ open, onOpenChange, fieldLabel, onBinderOnly, onPlatform }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Apply this change to:</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            You're editing: {fieldLabel}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-3">
          <Button
            variant="outline"
            className="justify-start text-xs h-10"
            onClick={() => { onBinderOnly(); onOpenChange(false); }}
          >
            This binder only
          </Button>
          <Button
            variant="outline"
            className="justify-start text-xs h-10"
            onClick={() => { onPlatform(); onOpenChange(false); }}
          >
            Platform routes
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-xs h-10 text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
