"""Analytics KPI endpoint."""

from fastapi import APIRouter, Query

from schemas import AnalyticsResponse
from services.analytics_service import get_analytics_payload

router = APIRouter(tags=["Analytics"])


@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    summary="Recruitment KPI metrics and skill distribution",
)
def get_analytics(
    domain: str | None = Query(None, description="Hiring domain for skill benchmarks"),
    job_skills: str | None = Query(
        None,
        description="Comma-separated required skills",
    ),
) -> AnalyticsResponse:
    payload = get_analytics_payload(domain=domain, job_skills_csv=job_skills)
    return AnalyticsResponse(**payload)
