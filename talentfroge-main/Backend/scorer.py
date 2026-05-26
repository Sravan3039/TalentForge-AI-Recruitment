"""
Skill matching and candidate match score calculation.
"""

import re
from typing import Sequence

# Default job skills for Data Engineer / Analytics roles
DEFAULT_JOB_SKILLS: list[str] = [
    "Python",
    "SQL",
    "Pandas",
    "Machine Learning",
    "Data Analysis",
    "Excel",
    "ETL",
    "Streamlit",
]

# Aliases map resume keywords to canonical skill names
SKILL_ALIASES: dict[str, list[str]] = {
    "python": ["python", "pyspark", "django", "flask"],
    "sql": ["sql", "sqlite", "postgresql", "mysql", "tsql", "pl/sql", "bigquery"],
    "pandas": ["pandas", "numpy", "dataframe"],
    "machine learning": [
        "machine learning",
        "ml",
        "deep learning",
        "scikit-learn",
        "sklearn",
        "tensorflow",
        "pytorch",
        "neural network",
    ],
    "data analysis": [
        "data analysis",
        "data analytics",
        "analytics",
        "business intelligence",
        "bi",
        "visualization",
        "tableau",
        "power bi",
    ],
    "excel": ["excel", "spreadsheet", "vlookup", "pivot table"],
    "etl": ["etl", "extract transform", "data pipeline", "airflow", "dbt", "spark"],
    "streamlit": ["streamlit", "dash", "gradio"],
}


def _normalize_skill(skill: str) -> str:
    return skill.strip().lower()


def _skill_in_text(canonical: str, text_lower: str) -> bool:
    """Check if a skill (or its aliases) appears in resume text."""
    aliases = SKILL_ALIASES.get(canonical, [canonical])
    for alias in aliases:
        # Word boundary match to reduce false positives on short tokens
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, text_lower):
            return True
    return False


def match_skills(resume_text: str, job_skills: Sequence[str]) -> list[str]:
    """
    Return list of job skills found in the resume (canonical casing from job_skills).
    """
    if not resume_text:
        return []

    text_lower = resume_text.lower()
    matched: list[str] = []

    for skill in job_skills:
        canonical = _normalize_skill(skill)
        if _skill_in_text(canonical, text_lower):
            matched.append(skill)

    return matched


def calculate_match_score(
    resume_text: str,
    job_skills: Sequence[str],
) -> tuple[float, list[str]]:
    """
    Compute match percentage: (matched skills / total job skills) * 100.

    Returns:
        (score_percentage, list of matched skill names)
    """
    if not job_skills:
        return 0.0, []

    matched = match_skills(resume_text, job_skills)
    score = (len(matched) / len(job_skills)) * 100.0
    return round(score, 2), matched
