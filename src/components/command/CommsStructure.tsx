import { motion } from "framer-motion";
import { Radio, Mic, Phone } from "lucide-react";
import type { CommEntry } from "@/data/mock-phase5";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";

const typeIcon: Record<CommEntry["type"], typeof Radio> = {
  "Clear-Com": Phone,
  LQ: Radio,
  "Hot Mic": Mic,
};

const typeStyle: Record<CommEntry["type"], string> = {
  "Clear-Com": "bg-secondary text-muted-foreground",
  LQ: "bg-crimson/15 text-crimson",
  "Hot Mic": "bg-amber-900/30 text-amber-400",
};

export function CommsStructure({ comms }: { comms: CommEntry[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Comms Structure</h2>
      <div className="steel-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[10px] tracking-wider uppercase w-28">Type</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase w-24">Channel</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">Assignment</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase w-28">Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comms.map((c) => {
              const Icon = typeIcon[c.type];
              return (
                <TableRow key={c.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded ${typeStyle[c.type]}`}>
                      <Icon className="w-3 h-3" />
                      {c.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-crimson">{c.channel}</TableCell>
                  <TableCell className="text-sm text-foreground">{c.assignment}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.location}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.section>
  );
}
