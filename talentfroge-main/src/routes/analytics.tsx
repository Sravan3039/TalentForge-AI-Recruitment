import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { ApiErrorBanner, ApiLoading } from "@/components/api-status";
import {
  useAnalytics,
  useCandidates,
  useDomains,
  useRecruiterInsights,
} from "@/lib/api/hooks";
import {
  buildPipelineFromRecommendations,
  buildScoreDistribution,
  buildSkillFreqFromDistribution,
} from "@/lib/api/mappers";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Activity, Target, Zap, Users } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/analytics")({ component: Analytics });

const COLORS = ["oklch(0.66 0.22 295)", "oklch(0.7 0.2 230)", "oklch(0.75 0.18 180)", "oklch(0.78 0.16 80)", "oklch(0.7 0.22 340)", "oklch(0.65 0.2 30)"];

function Analytics() {
  const [domain, setDomain] = useState<string>("");
  const domainsQuery = useDomains();
  const selectedDomain = domain || undefined;
  const analyticsQuery = useAnalytics(selectedDomain);
  const candidatesQuery = useCandidates();
  const insightsQuery = useRecruiterInsights(selectedDomain);

  const isLoading =
    analyticsQuery.isPending || candidatesQuery.isPending;
  const isError = analyticsQuery.isError || candidatesQuery.isError;
  const error = analyticsQuery.error ?? candidatesQuery.error;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Deep insights into your hiring pipeline and AI scoring." />
        <ApiLoading label="Loading analytics…" rows={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Deep insights into your hiring pipeline and AI scoring." />
        <ApiErrorBanner
          error={error}
          onRetry={() => {
            analyticsQuery.refetch();
            candidatesQuery.refetch();
          }}
        />
      </div>
    );
  }

  const analytics = analyticsQuery.data!;
  const candidates = candidatesQuery.data?.candidates ?? [];
  const insights = insightsQuery.data;
  const total = analytics.total_candidates;
  const avg = Math.round(analytics.average_score);
  const scores = candidates.map((c) => c.match_score);
  const above80 = scores.filter((s) => s >= 80).length;
  const scoreDist = buildScoreDistribution(scores);
  const skillFreq = buildSkillFreqFromDistribution(analytics.skill_distribution);
  const skillPie = analytics.skill_distribution
    .filter((d) => d.candidates > 0)
    .slice(0, 6)
    .map((d) => ({
      domain: d.skill.length > 12 ? `${d.skill.slice(0, 12)}…` : d.skill,
      count: d.candidates,
    }));
  const pipeline = buildPipelineFromRecommendations(
    insights?.recruiter_recommendations ?? [],
    total,
  );
  const strongFit = (insights?.recruiter_recommendations ?? []).filter((r) =>
    r.recommendation.includes("Strong"),
  ).length;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Deep insights into your hiring pipeline and AI scoring."
        actions={
          domainsQuery.data && domainsQuery.data.length > 0 ? (
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="bg-card text-foreground border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Default skills</option>
              {domainsQuery.data.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard index={0} label="Total Candidates" value={total} icon={Users} />
        <KpiCard index={1} label="Avg Match Score" value={`${avg}%`} icon={Target} />
        <KpiCard index={2} label="High Match (>80)" value={above80} icon={Zap} />
        <KpiCard index={3} label="Strong Fits" value={strongFit} icon={Activity} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6">
          <h3 className="font-semibold mb-1">Score Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">How candidates cluster by AI match score</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scoreDist}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
              <XAxis dataKey="bucket" stroke="oklch(0.7 0.03 280)" fontSize={12} />
              <YAxis stroke="oklch(0.7 0.03 280)" fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.03 280)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12 }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {scoreDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong p-6">
          <h3 className="font-semibold mb-1">Skill Match Coverage</h3>
          <p className="text-xs text-muted-foreground mb-4">Candidates matching each required skill</p>
          {skillPie.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">No skill matches yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={skillPie} dataKey="count" nameKey="domain" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={2}>
                  {skillPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.21 0.03 280)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-strong p-6">
          <h3 className="font-semibold mb-1">Top Skills in Talent Pool</h3>
          <p className="text-xs text-muted-foreground mb-4">Most matched skills across resumes</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillFreq.slice(0, 10)} layout="vertical">
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" horizontal={false} />
              <XAxis type="number" stroke="oklch(0.7 0.03 280)" fontSize={12} />
              <YAxis dataKey="skill" type="category" stroke="oklch(0.7 0.03 280)" fontSize={11} width={90} />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.03 280)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12 }} />
              <Bar dataKey="count" fill="oklch(0.66 0.22 295)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-strong p-6">
          <h3 className="font-semibold mb-1">Hiring Funnel</h3>
          <p className="text-xs text-muted-foreground mb-4">AI recommendation tiers across the pool</p>
          <div className="space-y-3 mt-6">
            {pipeline.map((p, i) => {
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p.stage}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span>{p.stage}</span>
                    <span className="text-muted-foreground tabular-nums">{p.count} · {pct}%</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full" style={{ background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
