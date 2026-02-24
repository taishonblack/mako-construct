import { useCallback, useRef } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LockSnapshot } from "@/hooks/use-binder-state";

interface PdfExportProps {
  snapshot: LockSnapshot;
  binderTitle: string;
}

export function PdfExport({ snapshot, binderTitle }: PdfExportProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleExport = useCallback(() => {
    const s = snapshot.state;
    const version = snapshot.id.replace("lock-v", "");
    const lockedAt = new Date(snapshot.lockedAt).toLocaleString();

    const signalRows = s.signals
      .map(
        (sig) =>
          `<tr>
            <td>${sig.iso}</td>
            <td>${sig.productionAlias || "—"}</td>
            <td>${sig.transport || "—"}</td>
            <td>${sig.encoderInput || "—"}</td>
            <td>${sig.decoderOutput || "—"}</td>
            <td>${sig.destination || "—"}</td>
          </tr>`
      )
      .join("");
    const commsRows = s.comms
      .map(
        (c) =>
          `<tr>
            <td>${c.type}</td>
            <td>${c.channel}</td>
            <td>${c.assignment}</td>
            <td>${c.location}</td>
          </tr>`
      )
      .join("");

    const checklistRows = s.checklist
      .map(
        (c) =>
          `<tr>
            <td>${c.checked ? "✓" : "○"}</td>
            <td>${c.label}</td>
            <td>${c.assignedTo || "—"}</td>
            <td>${c.status}</td>
          </tr>`
      )
      .join("");

    const issueRows = s.issues
      .map(
        (i) =>
          `<tr>
            <td style="color:${i.priority === "high" ? "#dc2626" : i.priority === "medium" ? "#d97706" : "#666"}">${i.priority}</td>
            <td>${i.title}</td>
            <td>${i.status}</td>
          </tr>`
      )
      .join("");

    const eh = s.eventHeader;

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${binderTitle} — Lock v${version}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Helvetica Neue", Arial, sans-serif; color: #111; padding: 32px 40px; font-size: 11px; line-height: 1.5; }
    h1 { font-size: 18px; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 2px; }
    .subtitle { font-size: 10px; color: #666; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 24px; margin-bottom: 20px; padding: 12px; background: #f8f8f8; border: 1px solid #e5e5e5; }
    .meta-grid dt { font-size: 8px; text-transform: uppercase; letter-spacing: 0.15em; color: #999; }
    .meta-grid dd { font-size: 11px; font-weight: 600; margin-bottom: 6px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 18px 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
    th { font-size: 8px; text-transform: uppercase; letter-spacing: 0.12em; color: #999; background: #fafafa; }
    .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 8px; color: #aaa; text-align: center; }
    @media print { body { padding: 16px 24px; } }
  </style>
</head>
<body>
  <h1>${binderTitle}</h1>
  <div class="subtitle">Lock v${version} · Locked ${lockedAt} by ${snapshot.lockedBy} · Pre-Air Distribution Copy</div>

  <dl class="meta-grid">
    <div><dt>League</dt><dd>${s.league || "NHL"}</dd></div>
    <div><dt>Partner</dt><dd>${s.partner || "—"}</dd></div>
    <div><dt>Arena</dt><dd>${s.venue || "—"}</dd></div>
    <div><dt>Event Date</dt><dd>${s.eventDate || "—"}</dd></div>
    <div><dt>Show Type</dt><dd>${s.showType || "—"}</dd></div>
    <div><dt>ISO Count</dt><dd>${s.isoCount}</dd></div>
    <div><dt>Control Room</dt><dd>CR-${eh?.controlRoom || "—"}</dd></div>
    <div><dt>Onsite Tech Manager</dt><dd>${eh?.onsiteTechManager || "—"}</dd></div>
    <div><dt>Broadcast Feed</dt><dd>${eh?.broadcastFeed || "—"}</dd></div>
    <div><dt>Primary Transport</dt><dd>${s.transport?.primary?.protocol || "—"}</dd></div>
    <div><dt>Backup Transport</dt><dd>${s.transport?.backup?.protocol || "—"}</dd></div>
    <div><dt>Return Feed</dt><dd>${s.returnRequired ? "Yes" : "No"}</dd></div>
  </dl>

  ${s.signals.length > 0 ? `
  <h2>Signal Matrix (${s.signals.length} signals)</h2>
  <table>
    <thead><tr><th>ISO</th><th>Alias</th><th>Transport</th><th>Encoder</th><th>Decoder</th><th>Destination</th></tr></thead>
    <tbody>${signalRows}</tbody>
  </table>` : ""}

  ${s.comms.length > 0 ? `
  <h2>Comms Structure (${s.comms.length} channels)</h2>
  <table>
    <thead><tr><th>Type</th><th>Channel</th><th>Assignment</th><th>Location</th></tr></thead>
    <tbody>${commsRows}</tbody>
  </table>` : ""}

  ${s.checklist.length > 0 ? `
  <h2>Checklist (${s.checklist.filter(c => c.checked).length}/${s.checklist.length} complete)</h2>
  <table>
    <thead><tr><th></th><th>Task</th><th>Assigned</th><th>Status</th></tr></thead>
    <tbody>${checklistRows}</tbody>
  </table>` : ""}

  ${s.issues.length > 0 ? `
  <h2>Issues (${s.issues.length})</h2>
  <table>
    <thead><tr><th>Priority</th><th>Issue</th><th>Status</th></tr></thead>
    <tbody>${issueRows}</tbody>
  </table>` : ""}

  <div class="footer">
    MAKO Live · ${binderTitle} · Lock v${version} · Generated ${new Date().toLocaleString()}
  </div>
</body>
</html>`;

    // Open in hidden iframe and trigger print
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.print();
    }, 300);
  }, [snapshot, binderTitle]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="text-[10px] tracking-wider uppercase gap-1.5"
      >
        <FileDown className="w-3 h-3" /> Export PDF
      </Button>
      <iframe
        ref={iframeRef}
        className="hidden"
        title="pdf-export"
        style={{ position: "absolute", width: 0, height: 0, border: "none" }}
      />
    </>
  );
}
