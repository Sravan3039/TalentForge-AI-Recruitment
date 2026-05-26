import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, Target, Award, Zap, ArrowRight, Sparkles } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { ApiErrorBanner, ApiLoading } from "@/components/api-status";
import {
  useAnalytics,
  useCandidates,
  useRecruiterInsights,
} from "@/lib/api/hooks";
import {
  buildHiringTrend,
  buildPipelineFromRecommendations,
  buildSkillFreqFromCandidates,
  mapCandidatesList,
} from "@/lib/api/mappers";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const candidatesQuery = useCandidates();
  const analyticsQuery = useAnalytics();
  const insightsQuery = useRecruiterInsights();

  const isLoading =
    candidatesQuery.isPending || analyticsQuery.isPending;
  const isError = candidatesQuery.isError || analyticsQuery.isError;
  const error = candidatesQuery.error ?? analyticsQuery.error;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Recruitment Dashboard" subtitle="Live overview of your AI-powered talent pipeline." />
        <ApiLoading label="Loading dashboard…" rows={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Recruitment Dashboard" subtitle="Live overview of your AI-powered talent pipeline." />
        <ApiErrorBanner
          error={error}
          onRetry={() => {
            candidatesQuery.refetch();
            analyticsQuery.refetch();
          }}
        />
      </div>
    );
  }

  const apiCandidates = candidatesQuery.data?.candidates ?? [];
  const analytics = analyticsQuery.data;
  const insights = insightsQuery.data;
  const uiCandidates = mapCandidatesList(apiCandidates, insights);
  const total = analytics?.total_candidates ?? apiCandidates.length;
  const avg = Math.round(analytics?.average_score ?? 0);
  const top = uiCandidates[0];
  const skillFreq = buildSkillFreqFromCandidates(apiCandidates);
  const mostSkill = skillFreq[0];
  const hiringTrend = buildHiringTrend(apiCandidates);
  const pipeline = buildPipelineFromRecommendations(
    insights?.recruiter_recommendations ?? [],
    total,
  );

  return (
    <div>
      <PageHeader
        title="Recruitment Dashboard"
        subtitle="Live overview of your AI-powered talent pipeline."
        actions={
          <Link to="/upload">
            <Button className="bg-[var(--gradient-primary)] hover:opacity-90 glow">
              <Sparkles className="size-4 mr-2" /> Upload Resumes
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard index={0} label="Total Candidates" value={total} icon={Users} />
        <KpiCard index={1} label="Avg Match Score" value={`${avg}%`} icon={Target} />
        <KpiCard
          index={2}
          label="Top Score"
          value={top ? `${top.score}%` : "—"}
          delta={analytics?.top_candidate?.name ?? top?.name ?? "—"}
          icon={Award}
        />
        <KpiCard
          index={3}
          label="Hottest Skill"
          value={mostSkill?.skill ?? "—"}
          delta={mostSkill ? `${mostSkill.count} candidates` : "Upload resumes"}
          icon={Zap}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Hiring Trend</h3>
              <p className="text-xs text-muted-foreground">Resumes indexed over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={hiringTrend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.66 0.22 295)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="oklch(0.66 0.22 295)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.7 0.2 230)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="oklch(0.7 0.2 230)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="month" stroke="oklch(0.7 0.03 280)" fontSize={12} />
              <YAxis stroke="oklch(0.7 0.03 280)" fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.03 280)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="applied" stroke="oklch(0.66 0.22 295)" fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="hired" stroke="oklch(0.7 0.2 230)" fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong p-6">
          <h3 className="font-semibold mb-1">Fit Pipeline</h3>
          <p className="text-xs text-muted-foreground mb-4">Candidates by AI recommendation tier</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipeline} layout="vertical">
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" horizontal={false} />
              <XAxis type="number" stroke="oklch(0.7 0.03 280)" fontSize={12} />
              <YAxis dataKey="stage" type="category" stroke="oklch(0.7 0.03 280)" fontSize={12} width={70} />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.03 280)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12 }} />
              <Bar dataKey="count" fill="oklch(0.66 0.22 295)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-strong p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Top Candidates</h3>
            <p className="text-xs text-muted-foreground">Highest AI match scores this cycle</p>
          </div>
          <Link to="/candidates" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="size-3" />
          </Link>
        </div>
        {uiCandidates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No candidates yet. <Link to="/upload" className="text-primary hover:underline">Upload resumes</Link> to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {uiCandidates.slice(0, 5).map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition"
              >
                <div className="size-10 rounded-full bg-[var(--gradient-primary)] grid place-items-center text-sm font-semibold text-primary-foreground">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.resumeFile} · {c.matched.length} skills matched</div>
                </div>
                <div className="hidden md:flex flex-1 max-w-sm items-center gap-3">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.score}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.8 }}
                      className="h-full bg-[var(--gradient-primary)]"
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-10 text-right">{c.score}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
