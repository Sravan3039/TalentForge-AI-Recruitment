import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiUploadResume } from "./client";
import type {
  AnalyticsResponse,
  CandidatesResponse,
  DomainsResponse,
  RecruiterInsightsResponse,
} from "./types";

export const queryKeys = {
  domains: ["domains"] as const,
  candidates: ["candidates"] as const,
  analytics: (domain?: string, jobSkills?: string) =>
    ["analytics", domain ?? "", jobSkills ?? ""] as const,
  insights: (domain?: string, jobSkills?: string) =>
    ["insights", domain ?? "", jobSkills ?? ""] as const,
};

export function useDomains() {
  return useQuery({
    queryKey: queryKeys.domains,
    queryFn: () => apiGet<DomainsResponse>("/domains"),
    select: (data) => data.domains,
  });
}

export function useCandidates() {
  return useQuery({
    queryKey: queryKeys.candidates,
    queryFn: () => apiGet<CandidatesResponse>("/candidates"),
  });
}

export function useAnalytics(domain?: string, jobSkills?: string) {
  const jobSkillsParam = jobSkills?.trim() || undefined;
  return useQuery({
    queryKey: queryKeys.analytics(domain, jobSkillsParam),
    queryFn: () =>
      apiGet<AnalyticsResponse>("/analytics", {
        domain,
        job_skills: jobSkillsParam,
      }),
  });
}

export function useRecruiterInsights(domain?: string, jobSkills?: string) {
  const jobSkillsParam = jobSkills?.trim() || undefined;
  return useQuery({
    queryKey: queryKeys.insights(domain, jobSkillsParam),
    queryFn: () =>
      apiGet<RecruiterInsightsResponse>("/recruiter-insights", {
        domain,
        job_skills: jobSkillsParam,
      }),
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      domain,
      jobSkills,
    }: {
      file: File;
      domain?: string;
      jobSkills?: string[];
    }) => apiUploadResume(file, { domain, jobSkills }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}
