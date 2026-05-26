"""
SQLite persistence layer for the Recruitment Analytics Platform.

Handles schema initialization, candidate CRUD, and duplicate prevention
(based on normalized email when available, otherwise resume filename).
"""

import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

# Default database file in project root
DB_PATH = Path(__file__).parent / "recruitment.db"


@contextmanager
def get_connection(db_path: Path | str = DB_PATH):
    """Context manager yielding a SQLite connection with row factory."""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(db_path: Path | str = DB_PATH) -> None:
    """
    Create candidates table if it does not exist.

    Schema:
        id              INTEGER PRIMARY KEY
        candidate_name  TEXT
        email           TEXT UNIQUE (nullable; duplicates blocked when set)
        resume_filename TEXT
        resume_text     TEXT
        match_score     REAL
        matched_skills  TEXT (comma-separated)
        created_at      TEXT (ISO timestamp)
    """
    with get_connection(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_name TEXT NOT NULL,
                email TEXT,
                resume_filename TEXT NOT NULL,
                resume_text TEXT,
                match_score REAL NOT NULL DEFAULT 0,
                matched_skills TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(email)
            )
            """
        )
        # Prevent re-uploading the same file name when email is unknown
        conn.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_resume_filename
            ON candidates(resume_filename)
            WHERE email IS NULL OR email = ''
            """
        )


def _normalize_email(email: str | None) -> str | None:
    if not email:
        return None
    cleaned = email.strip().lower()
    return cleaned if cleaned else None


def candidate_exists(
    email: str | None,
    resume_filename: str,
    db_path: Path | str = DB_PATH,
) -> bool:
    """Return True if a candidate with the same email or filename already exists."""
    norm_email = _normalize_email(email)
    with get_connection(db_path) as conn:
        if norm_email:
            row = conn.execute(
                "SELECT 1 FROM candidates WHERE LOWER(TRIM(email)) = ?",
                (norm_email,),
            ).fetchone()
            if row:
                return True
        row = conn.execute(
            "SELECT 1 FROM candidates WHERE resume_filename = ?",
            (resume_filename,),
        ).fetchone()
        return row is not None


def insert_candidate(
    candidate_name: str,
    email: str | None,
    resume_filename: str,
    resume_text: str,
    match_score: float,
    matched_skills: list[str],
    db_path: Path | str = DB_PATH,
) -> int:
    """
    Insert a new candidate record. Raises sqlite3.IntegrityError on duplicate.
    Returns the new row id.
    """
    skills_str = ", ".join(matched_skills) if matched_skills else ""
    created_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    with get_connection(db_path) as conn:
        cursor = conn.execute(
            """
            INSERT INTO candidates (
                candidate_name, email, resume_filename, resume_text,
                match_score, matched_skills, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                candidate_name,
                _normalize_email(email),
                resume_filename,
                resume_text,
                round(match_score, 2),
                skills_str,
                created_at,
            ),
        )
        return cursor.lastrowid


def get_all_candidates(db_path: Path | str = DB_PATH) -> list[dict[str, Any]]:
    """Fetch all candidates ordered by match_score descending."""
    with get_connection(db_path) as conn:
        rows = conn.execute(
            """
            SELECT id, candidate_name, email, resume_filename,
                   match_score, matched_skills, created_at
            FROM candidates
            ORDER BY match_score DESC, candidate_name ASC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def get_candidate_count(db_path: Path | str = DB_PATH) -> int:
    """Return total number of stored candidates."""
    with get_connection(db_path) as conn:
        row = conn.execute("SELECT COUNT(*) AS cnt FROM candidates").fetchone()
        return int(row["cnt"])


def get_average_score(db_path: Path | str = DB_PATH) -> float:
    """Return average match score across all candidates (0 if empty)."""
    with get_connection(db_path) as conn:
        row = conn.execute(
            "SELECT AVG(match_score) AS avg_score FROM candidates"
        ).fetchone()
        return float(row["avg_score"] or 0.0)
