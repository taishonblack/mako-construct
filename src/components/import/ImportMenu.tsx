import { useState } from "react";
import { Plus, FileText, Mail, FileUp, ClipboardPaste } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Props {
  onImport: () => void;
}

export function ImportMenu({ onImport }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-[10px] tracking-wider uppercase h-8 gap-1.5">
          <Plus className="w-3 h-3" />
          Import
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onImport} className="gap-2 text-xs">
          <FileText className="w-3.5 h-3.5" />
          Import Call Sheet (AI)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImport} className="gap-2 text-xs">
          <Mail className="w-3.5 h-3.5" />
          Import Email (AI)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImport} className="gap-2 text-xs">
          <FileUp className="w-3.5 h-3.5" />
          Import PDF (AI)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImport} className="gap-2 text-xs">
          <ClipboardPaste className="w-3.5 h-3.5" />
          Paste Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
