export type ApiErrorBody = {
  detail: string;
  error_code?: string;
};

export type Domain = {
  id: string;
  name: string;
  skills: string[];
};

export type DomainsResponse = {
  domains: Domain[];
};

export type ApiCandidate = {
  id: number;
  rank: number;
  candidate_name: string;
  email: string | null;
  match_score: number;
  matched_skills: string[];
  resume_filename: string;
  created_at: string;
};

export type CandidatesResponse = {
  candidates: ApiCandidate[];
  total: number;
};

export type SkillDistributionItem = {
  skill: string;
  candidates: number;
  match_rate_percent: number;
};

export type TopCandidate = {
  name: string;
  match_score: number;
  matched_skills: string[];
};

export type AnalyticsResponse = {
  total_candidates: number;
  average_score: number;
  top_candidate: TopCandidate | null;
  skill_distribution: SkillDistributionItem[];
};

export type SkillGapItem = {
  skill: string;
  candidates_with_skill: number;
  match_rate_percent: number;
  gap_level: "low" | "medium" | "high";
};

export type MissingSkillsItem = {
  candidate: string;
  match_score: number;
  missing_skills: string[];
};

export type RecruiterRecommendation = {
  candidate: string;
  match_score: number;
  recommendation: string;
};

export type RecruiterInsightsResponse = {
  skill_gap_analysis: SkillGapItem[];
  missing_skills: MissingSkillsItem[];
  recruiter_recommendations: RecruiterRecommendation[];
};

export type UploadResumeResponse = {
  id: number;
  candidate_name: string;
  email: string | null;
  resume_filename: string;
  match_score: number;
  matched_skills: string[];
  message: string;
};
