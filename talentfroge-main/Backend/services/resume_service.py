"""
Resume upload pipeline: parse PDF, score, persist.
"""

import io
import sqlite3
from pathlib import Path

from fastapi import UploadFile

import database as db
from config import ALLOWED_RESUME_EXTENSIONS, DB_PATH, MAX_UPLOAD_BYTES
from parser import extract_candidate_name, extract_email, extract_text_from_pdf
from scorer import calculate_match_score
from services.skills import resolve_job_skills


class ResumeProcessingError(Exception):
    """Raised when resume upload or parsing fails."""

    def __init__(self, message: str, error_code: str = "processing_error"):
        super().__init__(message)
        self.error_code = error_code


async def process_resume_upload(
    file: UploadFile,
    domain: str | None = None,
    job_skills_csv: str | None = None,
    db_path: Path = DB_PATH,
) -> dict:
    """
    Validate PDF, extract text, score against job skills, store candidate.

    Returns a dict suitable for UploadResumeResponse.
    """
    if not file.filename:
        raise ResumeProcessingError("Filename is required.", "missing_filename")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_RESUME_EXTENSIONS:
        raise ResumeProcessingError(
            f"Only PDF resumes are supported. Got '{suffix or 'unknown'}'.",
            "invalid_file_type",
        )

    raw = await file.read()
    if not raw:
        raise ResumeProcessingError("Uploaded file is empty.", "empty_file")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ResumeProcessingError(
            f"File exceeds maximum size of {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
            "file_too_large",
        )

    job_skills = resolve_job_skills(domain=domain, job_skills_csv=job_skills_csv)

    try:
        resume_text = extract_text_from_pdf(io.BytesIO(raw))
    except Exception as exc:
        raise ResumeProcessingError(
            f"Could not read PDF: {exc}",
            "pdf_parse_error",
        ) from exc

    if not resume_text.strip():
        raise ResumeProcessingError(
            "No text could be extracted from the PDF.",
            "empty_resume_text",
        )

    stem = Path(file.filename).stem
    candidate_name = extract_candidate_name(resume_text, fallback=stem.replace("_", " ").title())
    email = extract_email(resume_text)
    match_score, matched_skills = calculate_match_score(resume_text, job_skills)

    if db.candidate_exists(email, file.filename, db_path=db_path):
        raise ResumeProcessingError(
            "A candidate with this email or resume filename already exists.",
            "duplicate_candidate",
        )

    try:
        row_id = db.insert_candidate(
            candidate_name=candidate_name,
            email=email,
            resume_filename=file.filename,
            resume_text=resume_text,
            match_score=match_score,
            matched_skills=matched_skills,
            db_path=db_path,
        )
    except sqlite3.IntegrityError as exc:
        raise ResumeProcessingError(
            "Could not save candidate (duplicate email or filename).",
            "duplicate_candidate",
        ) from exc

    return {
        "id": row_id,
        "candidate_name": candidate_name,
        "email": email,
        "resume_filename": file.filename,
        "match_score": match_score,
        "matched_skills": matched_skills,
    }
