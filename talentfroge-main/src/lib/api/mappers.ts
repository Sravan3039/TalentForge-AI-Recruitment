import type {
  ApiCandidate,
  MissingSkillsItem,
  RecruiterRecommendation,
  RecruiterInsightsResponse,
  SkillGapItem,
} from "./types";

export type UICandidate = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  score: number;
  matched: string[];
  missing: string[];
  resumeFile: string;
  createdAt: string;
  rank: number;
  recommendation?: string;
  summary: string;
  stage: "Screening" | "Interview" | "Offer";
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function stageFromRecommendation(rec?: string): UICandidate["stage"] {
  if (!rec) return "Screening";
  if (rec.includes("Strong")) return "Interview";
  if (rec.includes("Moderate")) return "Screening";
  return "Screening";
}

export function mapApiCandidate(
  c: ApiCandidate,
  missingByName: Map<string, string[]>,
  recommendationByName: Map<string, string>,
): UICandidate {
  const missing = missingByName.get(c.candidate_name) ?? [];
  const recommendation = recommendationByName.get(c.candidate_name);
  return {
    id: String(c.id),
    name: c.candidate_name,
    email: c.email ?? "—",
    avatar: initials(c.candidate_name),
    score: Math.round(c.match_score),
    matched: c.matched_skills,
    missing,
    resumeFile: c.resume_filename,
    createdAt: c.created_at,
    rank: c.rank,
    recommendation,
    summary: `${c.candidate_name} scored ${Math.round(c.match_score)}% against required skills with ${c.matched_skills.length} matches on file (${c.resume_filename}).`,
    stage: stageFromRecommendation(recommendation),
  };
}

export function buildCandidateMaps(insights?: RecruiterInsightsResponse) {
  const missingByName = new Map<string, string[]>();
  const recommendationByName = new Map<string, string>();

  insights?.missing_skills.forEach((m: MissingSkillsItem) => {
    missingByName.set(m.candidate, m.missing_skills);
  });
  insights?.recruiter_recommendations.forEach((r: RecruiterRecommendation) => {
    recommendationByName.set(r.candidate, r.recommendation);
  });

  return { missingByName, recommendationByName };
}

export function mapCandidatesList(
  candidates: ApiCandidate[],
  insights?: RecruiterInsightsResponse,
): UICandidate[] {
  const { missingByName, recommendationByName } = buildCandidateMaps(insights);
  return candidates.map((c) =>
    mapApiCandidate(c, missingByName, recommendationByName),
  );
}

export function buildScoreDistribution(scores: number[]) {
  const buckets = [
    { bucket: "<50", test: (s: number) => s < 50 },
    { bucket: "50-60", test: (s: number) => s >= 50 && s < 60 },
    { bucket: "60-70", test: (s: number) => s >= 60 && s < 70 },
    { bucket: "70-80", test: (s: number) => s >= 70 && s < 80 },
    { bucket: "80-90", test: (s: number) => s >= 80 && s < 90 },
    { bucket: "90-100", test: (s: number) => s >= 90 },
  ];
  return buckets.map(({ bucket, test }) => ({
    bucket,
    count: scores.filter(test).length,
  }));
}

export function buildSkillFreqFromCandidates(candidates: ApiCandidate[]) {
  const counts = new Map<string, number>();
  candidates.forEach((c) => {
    c.matched_skills.forEach((s) => {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildSkillFreqFromDistribution(
  distribution: { skill: string; candidates: number }[],
) {
  return distribution
    .map((d) => ({ skill: d.skill, count: d.candidates }))
    .sort((a, b) => b.count - a.count);
}

export function buildPipelineFromRecommendations(
  recommendations: RecruiterRecommendation[],
  total: number,
) {
  const strong = recommendations.filter((r) =>
    r.recommendation.includes("Strong"),
  ).length;
  const moderate = recommendations.filter((r) =>
    r.recommendation.includes("Moderate"),
  ).length;
  const low = recommendations.filter((r) =>
    r.recommendation.includes("Low"),
  ).length;
  const other = Math.max(0, total - strong - moderate - low);

  return [
    { stage: "Strong fit", count: strong },
    { stage: "Moderate fit", count: moderate },
    { stage: "Low fit", count: low },
    { stage: "In review", count: other },
  ];
}

export function buildHiringTrend(candidates: ApiCandidate[]) {
  const byMonth = new Map<string, number>();
  candidates.forEach((c) => {
    const d = new Date(c.created_at);
    if (Number.isNaN(d.getTime())) return;
    const key = d.toLocaleString("en-US", { month: "short" });
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  });

  if (byMonth.size === 0) {
    return [{ month: "Now", applied: candidates.length, hired: 0 }];
  }

  return Array.from(byMonth.entries()).map(([month, applied]) => ({
    month,
    applied,
    hired: Math.max(0, Math.round(applied * 0.15)),
  }));
}

export type InsightCard = {
  type: "gap" | "trend" | "ai";
  title: string;
  body: string;
};

export function buildInsightCards(
  gaps: SkillGapItem[],
  recommendations: RecruiterRecommendation[],
): InsightCard[] {
  const cards: InsightCard[] = [];

  gaps
    .filter((g) => g.gap_level === "high")
    .slice(0, 2)
    .forEach((g) => {
      cards.push({
        type: "gap",
        title: `Skill gap: ${g.skill}`,
        body: `Only ${g.match_rate_percent}% of candidates match ${g.skill}. Consider targeted sourcing or upskilling for shortlisted hires.`,
      });
    });

  gaps
    .filter((g) => g.gap_level === "low" && g.match_rate_percent >= 60)
    .slice(0, 1)
    .forEach((g) => {
      cards.push({
        type: "trend",
        title: `Strong pool: ${g.skill}`,
        body: `${g.match_rate_percent}% of candidates already match ${g.skill} — prioritize depth in interviews.`,
      });
    });

  const strong = recommendations.filter((r) =>
    r.recommendation.includes("Strong"),
  );
  if (strong.length > 0) {
    const names = strong
      .slice(0, 3)
      .map((r) => r.candidate)
      .join(", ");
    cards.push({
      type: "ai",
      title: `Fast-track ${strong.length} candidate${strong.length > 1 ? "s" : ""}`,
      body: `${names} ${strong.length > 1 ? "are" : "is"} a strong fit — schedule interviews.`,
    });
  }

  if (cards.length === 0) {
    cards.push({
      type: "ai",
      title: "Upload resumes to unlock insights",
      body: "Add PDF resumes from the upload page to populate skill gap analysis and recommendations.",
    });
  }

  return cards.slice(0, 4);
}

export function filterByDomainSkills(
  candidates: UICandidate[],
  domainName: string,
  allDomains: { name: string; skills: string[] }[],
): UICandidate[] {
  const domain = allDomains.find((d) => d.name === domainName);
  if (!domain) return candidates;
  const skillSet = new Set(domain.skills.map((s) => s.toLowerCase()));
  return candidates.filter((c) =>
    c.matched.some((s) => skillSet.has(s.toLowerCase())),
  );
}
