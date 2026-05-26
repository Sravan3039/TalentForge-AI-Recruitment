"""
Centralized API exception handlers.
"""

import sqlite3

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from schemas import ErrorResponse
from services.resume_service import ResumeProcessingError


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ResumeProcessingError)
    async def resume_processing_handler(
        _request: Request,
        exc: ResumeProcessingError,
    ) -> JSONResponse:
        status_code = status.HTTP_400_BAD_REQUEST
        if exc.error_code == "duplicate_candidate":
            status_code = status.HTTP_409_CONFLICT
        return JSONResponse(
            status_code=status_code,
            content=ErrorResponse(
                detail=str(exc),
                error_code=exc.error_code,
            ).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(
        _request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        messages = [
            f"{'.'.join(str(loc) for loc in err.get('loc', []))}: {err.get('msg')}"
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorResponse(
                detail="; ".join(messages) or "Validation error",
                error_code="validation_error",
            ).model_dump(),
        )

    @app.exception_handler(sqlite3.IntegrityError)
    async def integrity_handler(
        _request: Request,
        exc: sqlite3.IntegrityError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=ErrorResponse(
                detail="Database constraint violated (duplicate record).",
                error_code="integrity_error",
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(
        _request: Request,
        _exc: Exception,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                detail="An unexpected server error occurred.",
                error_code="internal_error",
            ).model_dump(),
        )
