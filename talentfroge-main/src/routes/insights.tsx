import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { ApiErrorBanner, ApiLoading } from "@/components/api-status";
import { useRecruiterInsights } from "@/lib/api/hooks";
import { buildInsightCards, buildSkillFreqFromCandidates } from "@/lib/api/mappers";
import { useCandidates } from "@/lib/api/hooks";
import { Lightbulb, TrendingUp, AlertTriangle, Sparkles, MessageSquare } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/insights")({ component: Insights });

function iconForType(type: "gap" | "trend" | "ai") {
  if (type === "gap") return AlertTriangle;
  if (type === "trend") return TrendingUp;
  return Sparkles;
}

function Insights() {
  const [notes, setNotes] = useState("Strong pipeline this week. Focus on closing top candidates by Friday.");

  const insightsQuery = useRecruiterInsights();
  const candidatesQuery = useCandidates();
  const isLoading = insightsQuery.isPending || candidatesQuery.isPending;
  const isError = insightsQuery.isError || candidatesQuery.isError;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Recruiter Insights" subtitle="AI-generated recommendations, skill gaps, and talent intelligence." />
        <ApiLoading label="Loading recruiter insights…" rows={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Recruiter Insights" subtitle="AI-generated recommendations, skill gaps, and talent intelligence." />
        <ApiErrorBanner
          error={insightsQuery.error ?? candidatesQuery.error}
          onRetry={() => {
            insightsQuery.refetch();
            candidatesQuery.refetch();
          }}
        />
      </div>
    );
  }

  const insights = insightsQuery.data!;
  const apiCandidates = candidatesQuery.data?.candidates ?? [];
  const topSkills = buildSkillFreqFromCandidates(apiCandidates)
    .slice(0, 6)
    .map((s) => ({ skill: s.skill, value: Math.min(100, s.count * 12) }));
  const suggestions = buildInsightCards(
    insights.skill_gap_analysis,
    insights.recruiter_recommendations,
  );

  return (
    <div>
      <PageHeader title="Recruiter Insights" subtitle="AI-generated recommendations, skill gaps, and talent intelligence." />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {suggestions.map((s, i) => {
          const Icon = iconForType(s.type);
          return (
            <motion.div key={`${s.title}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-strong p-5">
              <div className="flex items-start gap-3">
                <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${s.type === "gap" ? "bg-[var(--color-warning)]/15 text-[var(--color-warning)]" : s.type === "trend" ? "bg-[var(--color-success)]/15 text-[var(--color-success)]" : "bg-primary/15 text-primary"}`}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{s.title}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.body}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6 lg:col-span-2">
          <h3 className="font-semibold mb-1">Talent Pool Skill Map</h3>
          <p className="text-xs text-muted-foreground mb-4">Skill density across top categories</p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={topSkills}>
              <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: "oklch(0.85 0.02 280)", fontSize: 12 }} />
              <PolarRadiusAxis stroke="oklch(1 0 0 / 0.1)" tick={false} />
              <Radar dataKey="value" stroke="oklch(0.66 0.22 295)" fill="oklch(0.66 0.22 295)" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="size-4 text-primary" />
            <h3 className="font-semibold">Recruiter Notes</h3>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-primary resize-none"
          />
          <Button className="mt-3 w-full bg-[var(--gradient-primary)] hover:opacity-90">
            <Lightbulb className="size-4 mr-2" /> Generate AI Summary
          </Button>
          <div className="mt-4 text-xs text-muted-foreground">
            {apiCandidates.length} candidates · {topSkills.length} top skills mapped
          </div>
        </motion.div>
      </div>
    </div>
  );
}
