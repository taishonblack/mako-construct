import type { CallSheetExtraction, ImportFileInfo } from "./import-types";

/** Simulate AI extraction from a call sheet. Returns after a delay to mimic processing. */
export function runMockExtraction(_file: ImportFileInfo): Promise<CallSheetExtraction> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        showTitle: { value: "NBA Finals — Game 3", confidence: "high" },
        showDate: { value: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), confidence: "high" },
        venue: { value: "Chase Center, San Francisco", confidence: "high" },
        controlRoom: { value: "PCR23", confidence: "medium" },
        callTimes: {
          value: [
            { label: "Crew Call", time: "14:00" },
            { label: "Rehearsal", time: "16:30" },
            { label: "Pre-Show", time: "18:00" },
            { label: "On Air", time: "19:00" },
            { label: "Wrap", time: "22:30" },
          ],
          confidence: "high",
        },
        staff: {
          value: [
            { name: "Alex Rivera", role: "TD", orgTag: "MAKO", email: "alex@mako.tv", phone: "" },
            { name: "Sam Chen", role: "Engineer", orgTag: "MAKO", email: "sam@mako.tv", phone: "+1-555-0102" },
            { name: "Jordan Lee", role: "Graphics", orgTag: "GFX Corp", email: "", phone: "+1-555-0201" },
            { name: "Morgan Walsh", role: "Audio A1", orgTag: "MAKO", email: "morgan@mako.tv", phone: "" },
          ],
          confidence: "medium",
        },
        tasks: {
          value: [
            { title: "Confirm satellite window", departmentTag: "Transport", dueTime: "12:00" },
            { title: "Test all camera feeds", departmentTag: "Engineering", dueTime: "15:00" },
            { title: "Load graphics package", departmentTag: "Graphics", dueTime: "16:00" },
            { title: "Audio check — all IFBs", departmentTag: "Audio", dueTime: "17:00" },
            { title: "Run full signal chain test", departmentTag: "Engineering", dueTime: "17:30" },
          ],
          confidence: "high",
        },
        routeHints: {
          value: [
            {
              txId: "TX-01",
              isoName: "ISO-1 Center",
              source: "Arena Floor",
              encoder: "Makito X4",
              transportType: "SRT Private",
              decoder: "Makito X4 RX",
              router: "CR-23",
              output: "ISO-1",
            },
            {
              txId: "TX-02",
              isoName: "ISO-2 Low",
              source: "Baseline Camera",
              encoder: "Makito X4",
              transportType: "SRT Private",
              decoder: "Makito X4 RX",
              router: "CR-23",
              output: "ISO-2",
            },
          ],
          confidence: "low",
        },
      });
    }, 2200);
  });
}
