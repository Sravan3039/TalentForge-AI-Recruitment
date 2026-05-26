"""
TalentForge AI Recruitment Analytics Platform — FastAPI backend.

Run locally:
    cd Backend
    pip install -r requirements.txt
    uvicorn app:app --reload --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database as db
from config import CORS_ORIGINS, DB_PATH
from exceptions import register_exception_handlers
from routers import analytics_route, candidates, domains_route, insights, upload
from schemas import HealthResponse

API_TITLE = "TalentForge Recruitment Analytics API"
API_VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db.init_db(DB_PATH)
    yield


app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="REST API for resume parsing, candidate scoring, and recruiter analytics.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(upload.router)
app.include_router(candidates.router)
app.include_router(analytics_route.router)
app.include_router(domains_route.router)
app.include_router(insights.router)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="talentforge-api")


@app.get("/", tags=["Health"])
def root() -> dict:
    return {
        "service": API_TITLE,
        "version": API_VERSION,
        "docs": "/docs",
        "endpoints": [
            "POST /upload-resume",
            "GET /candidates",
            "GET /analytics",
            "GET /domains",
            "GET /recruiter-insights",
        ],
    }
