"""Resume upload endpoint."""

from fastapi import APIRouter, File, Form, UploadFile

from schemas import UploadResumeResponse
from services.resume_service import ResumeProcessingError, process_resume_upload

router = APIRouter(tags=["Resumes"])


@router.post(
    "/upload-resume",
    response_model=UploadResumeResponse,
    summary="Upload and score a PDF resume",
)
async def upload_resume(
    file: UploadFile = File(..., description="PDF resume file"),
    domain: str | None = Form(
        None,
        description="Hiring domain name (e.g. Data Engineering)",
    ),
    job_skills: str | None = Form(
        None,
        description="Comma-separated required skills (overrides domain)",
    ),
) -> UploadResumeResponse:
    result = await process_resume_upload(
        file=file,
        domain=domain,
        job_skills_csv=job_skills,
    )
    return UploadResumeResponse(**result)
