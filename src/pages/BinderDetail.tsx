import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Radio, Cpu, Wifi, RotateCcw, AlertCircle, Clock, CheckCircle, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { mockBinderDetail } from "@/data/mock-binder-detail";
import { mockTransport, mockComms, mockChanges, mockIssues, mockDocs } from "@/data/mock-phase5";
import { ScheduleTab } from "@/components/binder/ScheduleTab";
import { ContactsTab } from "@/components/binder/ContactsTab";
import { SignalsTab } from "@/components/binder/SignalsTab";
import { TransportTab } from "@/components/binder/TransportTab";
import { CommsTab } from "@/components/binder/CommsTab";
import { ChangesIssuesTab } from "@/components/binder/ChangesIssuesTab";
import { DocsTab } from "@/components/binder/DocsTab";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-crimson/20 text-crimson",
  completed: "bg-emerald-900/30 text-emerald-400",
  archived: "bg-muted text-muted-foreground",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BinderDetail() {
  const { id } = useParams();
  const binder = mockBinderDetail; // In future, look up by id

  const infoTiles = [
    { label: "Signals", value: binder.isoCount, icon: Radio },
    { label: "Encoders", value: `${binder.encodersAssigned}/${binder.encodersRequired}`, icon: Cpu, warn: binder.encodersAssigned < binder.encodersRequired },
    { label: "Transport", value: `${binder.transport} / ${binder.backupTransport}`, icon: Wifi },
    { label: "Return Feed", value: binder.returnFeed ? "Active" : "Off", icon: RotateCcw },
    { label: "Open Issues", value: binder.openIssues, icon: AlertCircle, warn: binder.openIssues > 0 },
  ];

  return (
    <div className="max-w-6xl">
      {/* Back link */}
      <Link
        to="/binders"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Binder Library
      </Link>

      {/* Event header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-medium text-foreground tracking-tight">{binder.title}</h1>
            <span className={`text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded ${statusStyles[binder.status]}`}>
              {binder.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {binder.partner} · {binder.venue} · {formatDate(binder.eventDate)}
          </p>
        </div>
        {binder.pendingConfirmations > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-crimson">
            <Clock className="w-3.5 h-3.5" />
            {binder.pendingConfirmations} pending
          </div>
        )}
      </div>

      {/* Info tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {infoTiles.map((tile) => (
          <div key={tile.label} className="steel-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <tile.icon className={`w-3.5 h-3.5 ${tile.warn ? "text-crimson" : "text-muted-foreground"}`} />
              <span className="text-[10px] tracking-wider uppercase text-muted-foreground">{tile.label}</span>
            </div>
            <p className={`text-lg font-medium ${tile.warn ? "text-crimson" : "text-foreground"}`}>
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      {/* Schedule milestones + recent changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Next milestones */}
        <div className="steel-panel p-5">
          <h2 className="text-[10px] tracking-wider uppercase text-muted-foreground mb-4">Next Milestones</h2>
          <div className="space-y-3">
            {binder.schedule
              .filter((s) => s.type === "milestone")
              .slice(0, 3)
              .map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-crimson w-12 shrink-0">{item.time}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Recent changes */}
        <div className="steel-panel p-5">
          <h2 className="text-[10px] tracking-wider uppercase text-muted-foreground mb-4">Recent Changes</h2>
          <div className="space-y-3">
            {binder.recentChanges.map((change, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{change.label}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(change.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="bg-secondary border border-border rounded-md flex-wrap">
          <TabsTrigger value="schedule" className="text-xs tracking-wide uppercase data-[state=active]:bg-card data-[state=active]:text-foreground">Schedule</TabsTrigger>
          <TabsTrigger value="signals" className="text-xs tracking-wide uppercase data-[state=active]:bg-card data-[state=active]:text-foreground">Signals</TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs tracking-wide uppercase data-[state=active]:bg-card data-[state=active]:text-foreground">Contacts</TabsTrigger>
          <TabsTrigger value="transport" className="text-xs tracking-wide uppercase data-[state=active]:bg-card data-[state=active]:text-foreground">Transport</TabsTrigger>
          <TabsTrigger value="comms" className="text-xs tracking-wide uppercase data-[state=active]:bg-card data-[state=active]:text-foreground">Comms</TabsTrigger>
          <TabsTrigger value="changes" className="text-xs tracking-wide uppercase data-[state=active]:bg-card data-[state=active]:text-foreground">Changes & Issues</TabsTrigger>
          <TabsTrigger value="docs" className="text-xs tracking-wide uppercase data-[state=active]:bg-card data-[state=active]:text-foreground">Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule"><ScheduleTab schedule={binder.schedule} /></TabsContent>
        <TabsContent value="signals"><SignalsTab initialIsoCount={binder.isoCount} encodersAssigned={binder.encodersAssigned} /></TabsContent>
        <TabsContent value="contacts"><ContactsTab contacts={binder.contacts} /></TabsContent>
        <TabsContent value="transport"><TransportTab config={mockTransport} /></TabsContent>
        <TabsContent value="comms"><CommsTab comms={mockComms} /></TabsContent>
        <TabsContent value="changes"><ChangesIssuesTab changes={mockChanges} issues={mockIssues} /></TabsContent>
        <TabsContent value="docs"><DocsTab docs={mockDocs} /></TabsContent>
      </Tabs>
    </div>
  );
}
