"""
Resolve job skills from domain name, slug, or explicit skill lists.
"""

import re

from domains import DOMAINS
from scorer import DEFAULT_JOB_SKILLS


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


_DOMAIN_BY_SLUG = {_slugify(name): skills for name, skills in DOMAINS.items()}
_DOMAIN_BY_NAME = {name.lower(): skills for name, skills in DOMAINS.items()}


def resolve_job_skills(
    domain: str | None = None,
    job_skills_csv: str | None = None,
) -> list[str]:
    """
    Pick evaluation skills from explicit CSV, hiring domain, or defaults.
    """
    if job_skills_csv and job_skills_csv.strip():
        return [s.strip() for s in job_skills_csv.split(",") if s.strip()]

    if domain and domain.strip():
        key = domain.strip()
        lowered = key.lower()
        if lowered in _DOMAIN_BY_NAME:
            return list(_DOMAIN_BY_NAME[lowered])
        slug = _slugify(key)
        if slug in _DOMAIN_BY_SLUG:
            return list(_DOMAIN_BY_SLUG[slug])
        # Partial match on domain display name
        for name, skills in DOMAINS.items():
            if lowered in name.lower() or _slugify(name) == slug:
                return list(skills)

    return list(DEFAULT_JOB_SKILLS)


def domain_catalog() -> list[dict[str, str | list[str]]]:
    """All hiring domains with stable ids for the frontend."""
    return [
        {"id": _slugify(name), "name": name, "skills": list(skills)}
        for name, skills in DOMAINS.items()
    ]
