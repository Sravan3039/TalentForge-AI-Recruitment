"""
Resume parsing utilities: PDF text extraction and light metadata detection.
"""

import io
import re
from typing import BinaryIO

import pdfplumber


# Simple patterns for optional contact extraction from resume text
EMAIL_PATTERN = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
)
# First line that looks like a name (2–4 capitalized words, no digits)
NAME_PATTERN = re.compile(
    r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*$",
    re.MULTILINE,
)


def extract_text_from_pdf(file_obj: BinaryIO) -> str:
    """
    Extract plain text from a PDF using pdfplumber.

    Args:
        file_obj: File-like object (e.g. Streamlit UploadedFile).

    Returns:
        Concatenated text from all pages, normalized whitespace.
    """
    text_parts: list[str] = []
    # pdfplumber expects bytes or path; wrap in BytesIO if needed
    if hasattr(file_obj, "read"):
        data = file_obj.read()
        if hasattr(file_obj, "seek"):
            file_obj.seek(0)
        source = io.BytesIO(data)
    else:
        source = file_obj

    with pdfplumber.open(source) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    # Keep newlines for name heuristics; normalize spaces per line for matching
    raw_text = "\n".join(text_parts)
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in raw_text.splitlines() if ln.strip()]
    normalized = " ".join(lines)
    return normalized


def extract_email(text: str) -> str | None:
    """Return the first email found in resume text, or None."""
    match = EMAIL_PATTERN.search(text)
    return match.group(0).lower() if match else None


def extract_candidate_name(text: str, fallback: str = "Unknown Candidate") -> str:
    """
    Heuristic name extraction from the start of the resume text.
    Falls back to filename stem or 'Unknown Candidate'.
    """
    # First ~12 words often contain the name on single-line PDF extracts
    words = text.split()[:12]
    if 2 <= len(words) <= 4 and all(w.isalpha() for w in words):
        if words[0][0].isupper():
            return " ".join(words).title()

    lines = text[:800].replace(". ", "\n").split("\n")[:15]
    for line in lines:
        line = line.strip()
        if len(line) < 4 or len(line) > 60:
            continue
        if EMAIL_PATTERN.search(line):
            continue
        match = NAME_PATTERN.match(line)
        if match:
            return match.group(1).strip()
        # Title-case line with 2–4 words and no special chars
        words = line.split()
        if 2 <= len(words) <= 4 and all(w.isalpha() for w in words):
            if words[0][0].isupper():
                return line.title()

    return fallback
