"""
Application configuration for the TalentForge API.
"""

import os
from pathlib import Path

# SQLite database beside backend modules
DB_PATH = Path(__file__).parent / "recruitment.db"

# Comma-separated origins, or "*" for development
_cors_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:8080,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:8080,http://127.0.0.1:3000",
)
CORS_ORIGINS: list[str] = (
    ["*"] if _cors_raw.strip() == "*" else [o.strip() for o in _cors_raw.split(",") if o.strip()]
)

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))  # 10 MB
ALLOWED_RESUME_EXTENSIONS = {".pdf"}
