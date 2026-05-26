"""
Analytics and recruiter insights built on analytics.py + database.
"""

from typing import Any

import pandas as pd

import analytics
from services.skills import resolve_job_skills


def _parse_skills_list(cell: Any) -> list[str]:
    return analytics._parse_skills_cell(cell)


def _split_matched_skills(skills_str: str | None) -> list[str]:
    if not skills_str:
        return []
    return [s.strip() for s in skills_str.split(",") if s.strip()]


def get_candidates_leaderboard() -> list[dict[str, Any]]:
    """Ranked candidates for GET /candidates."""
    import database as db

    rows = db.get_all_candidates()
    out: list[dict[str, Any]] = []
    for rank, row in enumerate(rows, start=1):
        out.append(
            {
                "id": int(row["id"]),
                "rank": rank,
                "candidate_name": row["candidate_name"],
                "email": row.get("email"),
                "match_score": float(row["match_score"]),
                "matched_skills": _split_matched_skills(row.get("matched_skills")),
                "resume_filename": row["resume_filename"],
                "created_at": row["created_at"],
            }
        )
    return out


def get_analytics_payload(
    domain: str | None = None,
    job_skills_csv: str | None = None,
) -> dict[str, Any]:
    """KPI metrics and skill distribution for GET /analytics."""
    job_skills = resolve_job_skills(domain=domain, job_skills_csv=job_skills_csv)
    df = analytics.load_candidates_df()
    kpis = analytics.compute_kpis(df)

    top_candidate = None
    if not df.empty:
        top_idx = df["Match Score (%)"].idxmax()
        top_candidate = {
            "name": str(df.loc[top_idx, "Candidate"]),
            "match_score": float(df.loc[top_idx, "Match Score (%)"]),
            "matched_skills": _parse_skills_list(df.loc[top_idx, "Matched Skills"]),
        }

    dist_df = analytics.skill_match_distribution(df, job_skills)
    skill_distribution = []
    if not dist_df.empty:
        for _, row in dist_df.iterrows():
            skill_distribution.append(
                {
                    "skill": str(row["Skill"]),
                    "candidates": int(row["Candidates"]),
                    "match_rate_percent": float(row["Match Rate (%)"]),
                }
            )

    return {
        "total_candidates": int(kpis["total_candidates"]),
        "average_score": round(float(kpis["average_score"]), 2),
        "top_candidate": top_candidate,
        "skill_distribution": skill_distribution,
    }


def get_recruiter_insights_payload(
    domain: str | None = None,
    job_skills_csv: str | None = None,
) -> dict[str, Any]:
    """Skill gaps, per-candidate missing skills, and recommendations."""
    job_skills = resolve_job_skills(domain=domain, job_skills_csv=job_skills_csv)
    df = analytics.load_candidates_df()

    dist_df = analytics.skill_match_distribution(df, job_skills)
    skill_gap_analysis: list[dict[str, Any]] = []
    if not dist_df.empty:
        for _, row in dist_df.iterrows():
            rate = float(row["Match Rate (%)"])
            if rate >= 60:
                gap_level = "low"
            elif rate >= 30:
                gap_level = "medium"
            else:
                gap_level = "high"
            skill_gap_analysis.append(
                {
                    "skill": str(row["Skill"]),
                    "candidates_with_skill": int(row["Candidates"]),
                    "match_rate_percent": rate,
                    "gap_level": gap_level,
                }
            )

    missing_df = analytics.missing_skills_analysis(df, job_skills)
    missing_skills: list[dict[str, Any]] = []
    if not missing_df.empty:
        for _, row in missing_df.iterrows():
            raw = str(row["Missing Skills"])
            skills = (
                []
                if raw.lower() == "none"
                else [s.strip() for s in raw.split(",") if s.strip()]
            )
            missing_skills.append(
                {
                    "candidate": str(row["Candidate"]),
                    "match_score": float(row["Match Score (%)"]),
                    "missing_skills": skills,
                }
            )

    rec_df = analytics.candidate_recommendations(df)
    recruiter_recommendations: list[dict[str, Any]] = []
    if not rec_df.empty:
        for _, row in rec_df.iterrows():
            recruiter_recommendations.append(
                {
                    "candidate": str(row["Candidate"]),
                    "match_score": float(row["Match Score (%)"]),
                    "recommendation": str(row["Recommendation"]),
                }
            )

    return {
        "skill_gap_analysis": skill_gap_analysis,
        "missing_skills": missing_skills,
        "recruiter_recommendations": recruiter_recommendations,
    }
