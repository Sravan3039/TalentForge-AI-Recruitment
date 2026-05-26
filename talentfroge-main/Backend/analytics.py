"""
Pandas analytics helpers for recruitment KPIs, insights, and table filtering.
"""

from __future__ import annotations

from collections import Counter
from typing import Any

import pandas as pd

import database as db


def load_candidates_df() -> pd.DataFrame:
    """Build a ranked DataFrame from SQLite (highest match score first)."""
    rows = db.get_all_candidates()
    columns = [
        "Rank",
        "Candidate",
        "Email",
        "Match Score (%)",
        "Matched Skills",
        "Resume File",
        "Added",
    ]
    if not rows:
        return pd.DataFrame(columns=columns)

    df = pd.DataFrame(rows)
    df = df.sort_values("match_score", ascending=False).reset_index(drop=True)
    df["Rank"] = range(1, len(df) + 1)
    df = df.rename(
        columns={
            "candidate_name": "Candidate",
            "email": "Email",
            "match_score": "Match Score (%)",
            "matched_skills": "Matched Skills",
            "resume_filename": "Resume File",
            "created_at": "Added",
        }
    )
    return df[columns]


def _to_scalar(value: Any) -> Any:
    """Extract a single scalar from a pandas Series, ndarray, or plain value."""
    if isinstance(value, pd.Series):
        if value.empty:
            return None
        value = value.iloc[0]
    elif hasattr(value, "ndim") and getattr(value, "ndim", 0) > 0:
        try:
            value = value.item() if value.size == 1 else value.flat[0]
        except (AttributeError, IndexError, ValueError):
            value = value[0] if len(value) else None
    return value


def _parse_skills_cell(cell: Any) -> list[str]:
    """
    Parse a comma-separated skills string from a DB cell or DataFrame value.

    Safely handles pandas Series (no boolean checks on Series), None, and NaN.
    """
    cell = _to_scalar(cell)

    if cell is None:
        return []
    if isinstance(cell, float) and pd.isna(cell):
        return []
    if pd.isna(cell):
        return []

    text = str(cell).strip()
    if not text or text.lower() in ("none", "nan"):
        return []

    return [s.strip() for s in text.split(",") if s.strip()]


def compute_kpis(df: pd.DataFrame) -> dict[str, Any]:
    """Aggregate KPIs for dashboard metric cards."""
    if df.empty:
        return {
            "total_candidates": 0,
            "average_score": 0.0,
            "highest_score": 0.0,
            "total_skills_matched": 0,
            "top_candidate": "—",
        }

    total_skills = sum(
        len(_parse_skills_cell(row["Matched Skills"])) for _, row in df.iterrows()
    )
    top_idx = df["Match Score (%)"].idxmax()

    return {
        "total_candidates": len(df),
        "average_score": float(df["Match Score (%)"].mean()),
        "highest_score": float(df["Match Score (%)"].max()),
        "total_skills_matched": total_skills,
        "top_candidate": str(df.loc[top_idx, "Candidate"]),
    }


def skill_match_distribution(df: pd.DataFrame, job_skills: list[str]) -> pd.DataFrame:
    """
    Count how many candidates matched each required skill.
    Returns DataFrame: Skill, Candidates, Match Rate (%).
    """
    if not job_skills:
        return pd.DataFrame(columns=["Skill", "Candidates", "Match Rate (%)"])

    counts: Counter[str] = Counter()
    for _, row in df.iterrows():
        matched = {s.lower() for s in _parse_skills_cell(row["Matched Skills"])}
        for skill in job_skills:
            if skill.lower() in matched:
                counts[skill] += 1

    total = len(df) if len(df) else 1
    records = [
        {
            "Skill": skill,
            "Candidates": counts.get(skill, 0),
            "Match Rate (%)": round((counts.get(skill, 0) / total) * 100, 1),
        }
        for skill in job_skills
    ]
    return pd.DataFrame(records).sort_values("Candidates", ascending=False)


def top_matched_skills(df: pd.DataFrame, top_n: int = 5) -> list[tuple[str, int]]:
    """Return the most frequently matched skills across all candidates."""
    counter: Counter[str] = Counter()
    for _, row in df.iterrows():
        counter.update(_parse_skills_cell(row["Matched Skills"]))
    return counter.most_common(top_n)


def missing_skills_analysis(
    df: pd.DataFrame, job_skills: list[str]
) -> pd.DataFrame:
    """
    Per-candidate gap analysis: skills required but not found on resume.
    """
    if df.empty or not job_skills:
        return pd.DataFrame(columns=["Candidate", "Match Score (%)", "Missing Skills"])

    rows = []
    job_set = {s.lower() for s in job_skills}
    for _, row in df.iterrows():
        matched = {s.lower() for s in _parse_skills_cell(row["Matched Skills"])}
        missing = [s for s in job_skills if s.lower() not in matched]
        rows.append(
            {
                "Candidate": row["Candidate"],
                "Match Score (%)": row["Match Score (%)"],
                "Missing Skills": ", ".join(missing) if missing else "None",
            }
        )
    return pd.DataFrame(rows)


def candidate_recommendations(
    df: pd.DataFrame, threshold_strong: float = 75.0, threshold_review: float = 50.0
) -> pd.DataFrame:
    """Classify candidates into recruiter action buckets."""
    if df.empty:
        return pd.DataFrame(columns=["Candidate", "Match Score (%)", "Recommendation"])

    recs = []
    for _, row in df.iterrows():
        score = float(row["Match Score (%)"])
        if score >= threshold_strong:
            action = "🟢 Strong fit — Schedule interview"
        elif score >= threshold_review:
            action = "🟡 Moderate fit — Technical screen"
        else:
            action = "🔴 Low fit — Keep in talent pool"
        recs.append(
            {
                "Candidate": row["Candidate"],
                "Match Score (%)": score,
                "Recommendation": action,
            }
        )
    return pd.DataFrame(recs)


def filter_and_sort_candidates(
    df: pd.DataFrame,
    min_score: float,
    search: str,
    sort_by: str,
    ascending: bool = False,
) -> pd.DataFrame:
    """Apply score filter, name search, and column sort."""
    if df.empty:
        return df

    out = df.copy()
    out = out[out["Match Score (%)"] >= min_score]

    if search.strip():
        q = search.strip().lower()
        out = out[
            out["Candidate"].str.lower().str.contains(q, na=False)
            | out["Email"].fillna("").str.lower().str.contains(q, na=False)
        ]

    if sort_by in out.columns:
        out = out.sort_values(sort_by, ascending=ascending)
        out["Rank"] = range(1, len(out) + 1)

    return out.reset_index(drop=True)
