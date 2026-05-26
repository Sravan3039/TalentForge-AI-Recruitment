"""
Pydantic response models for JSON API contracts.
"""

from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    detail: str
    error_code: str | None = None


class UploadResumeResponse(BaseModel):
    id: int
    candidate_name: str
    email: str | None = None
    resume_filename: str
    match_score: float
    matched_skills: list[str]
    message: str = "Resume processed successfully"


class CandidateLeaderboardItem(BaseModel):
    id: int
    rank: int
    candidate_name: str
    email: str | None = None
    match_score: float
    matched_skills: list[str]
    resume_filename: str
    created_at: str


class CandidatesResponse(BaseModel):
    candidates: list[CandidateLeaderboardItem]
    total: int


class TopCandidateInfo(BaseModel):
    name: str
    match_score: float
    matched_skills: list[str] = Field(default_factory=list)


class AnalyticsResponse(BaseModel):
    total_candidates: int
    average_score: float
    top_candidate: TopCandidateInfo | None = None
    skill_distribution: list[dict[str, Any]]


class DomainItem(BaseModel):
    id: str
    name: str
    skills: list[str]


class DomainsResponse(BaseModel):
    domains: list[DomainItem]


class SkillGapItem(BaseModel):
    skill: str
    candidates_with_skill: int
    match_rate_percent: float
    gap_level: str  # low | medium | high


class MissingSkillsItem(BaseModel):
    candidate: str
    match_score: float
    missing_skills: list[str]


class RecruiterRecommendationItem(BaseModel):
    candidate: str
    match_score: float
    recommendation: str


class RecruiterInsightsResponse(BaseModel):
    skill_gap_analysis: list[SkillGapItem]
    missing_skills: list[MissingSkillsItem]
    recruiter_recommendations: list[RecruiterRecommendationItem]


class HealthResponse(BaseModel):
    status: str
    service: str
