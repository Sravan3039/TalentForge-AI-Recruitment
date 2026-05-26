import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { DOMAINS, CANDIDATES } from "@/lib/mock-data";
import { Shield, Users, Layers, Activity, Plus, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const Route = createFileRoute("/admin")({ component: Admin });

const RECRUITERS = [
  { name: "Sarah Chen", role: "Lead Recruiter", access: "Admin", active: true },
  { name: "Marcus Brown", role: "Technical Recruiter", access: "Editor", active: true },
  { name: "Priya Sharma", role: "Talent Sourcer", access: "Viewer", active: true },
  { name: "Tom Reyes", role: "Hiring Manager", access: "Editor", active: false },
];

const ACTIVITY = [
  { who: "Sarah Chen", what: "Updated AI/ML hiring template", when: "2 min ago" },
  { who: "AI Engine", what: "Parsed 24 new resumes", when: "8 min ago" },
  { who: "Marcus Brown", what: "Shortlisted 3 candidates for Cloud role", when: "27 min ago" },
  { who: "Priya Sharma", what: "Added new skill: 'Vector Databases'", when: "1 hr ago" },
  { who: "AI Engine", what: "Completed 5 voice interviews", when: "2 hrs ago" },
];

function Admin() {
  const [domains, setDomains] = useState(DOMAINS);

  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Manage domains, recruiters, templates and platform activity." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard index={0} label="Active Domains" value={domains.length} icon={Layers} />
        <KpiCard index={1} label="Recruiters" value={RECRUITERS.filter(r => r.active).length} icon={Users} />
        <KpiCard index={2} label="Candidates Indexed" value={CANDIDATES.length} icon={Shield} />
        <KpiCard index={3} label="AI Actions Today" value="1,284" icon={Activity} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Hiring Domains</h3>
              <p className="text-xs text-muted-foreground">Manage roles and skill templates</p>
            </div>
            <Button size="sm" className="bg-[var(--gradient-primary)] hover:opacity-90"><Plus className="size-4 mr-1" />New Domain</Button>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {domains.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition">
                <div className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center text-xs font-semibold">{d.name.slice(0, 2).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{d.skills.length} skills · {CANDIDATES.filter(c => c.domain === d.name).length} candidates</div>
                </div>
                <button className="text-muted-foreground hover:text-foreground"><Edit3 className="size-4" /></button>
                <button onClick={() => setDomains(domains.filter(x => x.id !== d.id))} className="text-muted-foreground hover:text-[var(--color-destructive)]"><Trash2 className="size-4" /></button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recruiter Access</h3>
            <Button size="sm" variant="outline" className="border-white/10"><Plus className="size-4 mr-1" />Invite</Button>
          </div>
          <div className="space-y-3">
            {RECRUITERS.map((r, i) => (
              <motion.div key={r.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-[var(--gradient-primary)] grid place-items-center text-xs font-semibold text-primary-foreground">
                  {r.name.split(" ").map(p => p[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.role}</div>
                </div>
                <Badge variant="outline" className={`border-white/10 text-xs ${r.access === "Admin" ? "bg-primary/15 text-primary border-primary/20" : ""}`}>
                  {r.access}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-strong p-6">
        <h3 className="font-semibold mb-1">Activity Log</h3>
        <p className="text-xs text-muted-foreground mb-4">Recent recruiter & AI engine activity</p>
        <div className="divide-y divide-white/5">
          {ACTIVITY.map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className={`size-2 rounded-full ${a.who === "AI Engine" ? "bg-primary" : "bg-[var(--color-success)]"}`} />
                <span className="font-medium">{a.who}</span>
                <span className="text-muted-foreground">{a.what}</span>
              </div>
              <span className="text-xs text-muted-foreground">{a.when}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
