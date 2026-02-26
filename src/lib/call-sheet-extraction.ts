import type { CallSheetExtraction, ImportFileInfo } from "./import-types";

/** Simulate AI extraction from a call sheet. Returns after a delay to mimic processing. */
export function runCallSheetExtraction(_file: ImportFileInfo): Promise<CallSheetExtraction> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        showTitle: { value: "", confidence: "low" },
        showDate: { value: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), confidence: "low" },
        venue: { value: "", confidence: "low" },
        controlRoom: { value: "", confidence: "low" },
        callTimes: { value: [], confidence: "low" },
        staff: { value: [], confidence: "low" },
        tasks: { value: [], confidence: "low" },
        routeHints: { value: [], confidence: "low" },
      });
    }, 1200);
  });
}
