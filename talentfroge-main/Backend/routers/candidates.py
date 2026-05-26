"""Candidate leaderboard endpoint."""

from fastapi import APIRouter

from schemas import CandidatesResponse
from services.analytics_service import get_candidates_leaderboard

router = APIRouter(tags=["Candidates"])


@router.get(
    "/candidates",
    response_model=CandidatesResponse,
    summary="Ranked candidate leaderboard",
)
def list_candidates() -> CandidatesResponse:
    items = get_candidates_leaderboard()
    return CandidatesResponse(candidates=items, total=len(items))
