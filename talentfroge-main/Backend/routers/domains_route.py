"""Hiring domains catalog endpoint."""

from fastapi import APIRouter

from schemas import DomainItem, DomainsResponse
from services.skills import domain_catalog

router = APIRouter(tags=["Domains"])


@router.get(
    "/domains",
    response_model=DomainsResponse,
    summary="All hiring domains and required skills",
)
def list_domains() -> DomainsResponse:
    items = [DomainItem(**d) for d in domain_catalog()]
    return DomainsResponse(domains=items)
