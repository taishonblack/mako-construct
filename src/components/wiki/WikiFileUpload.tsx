import { useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface WikiAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

interface Props {
  attachments: WikiAttachment[];
  onChange: (attachments: WikiAttachment[]) => void;
  readOnly?: boolean;
  articleId?: string;
}

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPT = "image/*,.pdf,.svg,.vsdx,.dwg,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml";

function getIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-cyan-400" />;
  if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function WikiFileUpload({ attachments, onChange, readOnly, articleId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);

    const newAttachments: WikiAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) {
        setError(`${file.name} exceeds 20MB limit`);
        continue;
      }

      const path = `${articleId || "draft"}/${Date.now()}-${file.name}`;
      const { data, error: uploadErr } = await supabase.storage
        .from("wiki-attachments")
        .upload(path, file);

      if (uploadErr) {
        setError(`Failed to upload ${file.name}: ${uploadErr.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from("wiki-attachments").getPublicUrl(data.path);

      newAttachments.push({
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      });
    }

    onChange([...attachments, ...newAttachments]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAttachment(idx: number) {
    onChange(attachments.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded bg-secondary/40 border border-border group">
              {getIcon(att.type)}
              <a href={att.url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-foreground hover:text-primary transition-colors truncate flex-1">
                {att.name}
              </a>
              <span className="text-[10px] text-muted-foreground shrink-0">{formatSize(att.size)}</span>
              {att.type.startsWith("image/") && (
                <a href={att.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img src={att.url} alt={att.name} className="w-8 h-8 rounded object-cover border border-border" />
                </a>
              )}
              {!readOnly && (
                <button onClick={() => removeAttachment(i)}
                  className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {!readOnly && (
        <div>
          <input ref={inputRef} type="file" multiple accept={ACCEPT}
            onChange={e => handleFiles(e.target.files)} className="hidden" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 text-xs border border-dashed border-border rounded hover:border-primary hover:bg-secondary/30 transition-all text-muted-foreground disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading..." : "Upload files (images, PDFs, diagrams — max 20MB)"}
          </button>
          {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
        </div>
      )}
    </div>
  );
}
