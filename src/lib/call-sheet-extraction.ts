import type { CallSheetExtraction, ImportFileInfo } from "./import-types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/** Convert a File to base64 string */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g. "data:application/pdf;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Default empty extraction used as fallback */
function emptyExtraction(): CallSheetExtraction {
  return {
    showTitle: { value: "", confidence: "low" },
    showDate: { value: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), confidence: "low" },
    venue: { value: "", confidence: "low" },
    controlRoom: { value: "", confidence: "low" },
    callTimes: { value: [], confidence: "low" },
    staff: { value: [], confidence: "low" },
    tasks: { value: [], confidence: "low" },
    routeHints: { value: [], confidence: "low" },
  };
}

/** Extract structured data from a call sheet file using AI. */
export async function runCallSheetExtraction(file: ImportFileInfo): Promise<CallSheetExtraction> {
  // If no real file, return empty extraction for manual entry
  if (!file.rawFile && file.sourceType !== "paste") {
    return emptyExtraction();
  }

  try {
    let payload: Record<string, string>;

    if (file.rawFile) {
      const base64 = await fileToBase64(file.rawFile);
      payload = {
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type,
      };
    } else {
      // paste mode - rawFile would have text content in name for now
      payload = {
        rawText: file.name,
        fileName: "pasted-text.txt",
        mimeType: "text/plain",
      };
    }

    const { data, error } = await supabase.functions.invoke("extract-callsheet", {
      body: payload,
    });

    if (error) {
      console.error("Extract edge function error:", error);
      toast({
        title: "Extraction failed",
        description: error.message || "Could not reach AI extraction service.",
        variant: "destructive",
      });
      return emptyExtraction();
    }

    if (data?.error) {
      toast({
        title: "Extraction issue",
        description: data.error,
        variant: "destructive",
      });
      return emptyExtraction();
    }

    if (data?.extraction) {
      return data.extraction as CallSheetExtraction;
    }

    return emptyExtraction();
  } catch (err) {
    console.error("runCallSheetExtraction error:", err);
    toast({
      title: "Extraction error",
      description: err instanceof Error ? err.message : "Unknown error during extraction.",
      variant: "destructive",
    });
    return emptyExtraction();
  }
}
