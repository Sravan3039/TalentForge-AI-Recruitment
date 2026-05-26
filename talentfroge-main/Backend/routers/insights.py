"""Recruiter insights endpoint."""

from fastapi import APIRouter, Query

from schemas import RecruiterInsightsResponse
from services.analytics_service import get_recruiter_insights_payload

router = APIRouter(tags=["Insights"])


@router.get(
    "/recruiter-insights",
    response_model=RecruiterInsightsResponse,
    summary="Skill gaps, missing skills, and recruiter recommendations",
)
def recruiter_insights(
    domain: str | None = Query(None, description="Hiring domain for evaluation"),
    job_skills: str | None = Query(
        None,
        description="Comma-separated required skills",
    ),
) -> RecruiterInsightsResponse:
    payload = get_recruiter_insights_payload(
        domain=domain,
        job_skills_csv=job_skills,
    )
    return RecruiterInsightsResponse(**payload)
