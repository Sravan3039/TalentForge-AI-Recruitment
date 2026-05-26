"""
Entry point alias: ``uvicorn main:app`` loads the FastAPI application from app.py.
"""

from app import app

__all__ = ["app"]
