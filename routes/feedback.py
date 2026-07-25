# routes/feedback.py

"""
Persistent user feedback capture.
Opt-in only. Explicitly separate from engineering data ZDR policy —
feedback is voluntarily submitted by users for public display, not
confidential client engineering data.

Shared schema intended to be consistent across Azure and GCP deployments.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, EmailStr

router = APIRouter(prefix="/feedback", tags=["feedback"])


class Deployment(str, Enum):
    AZURE = "azure"
    GCP = "gcp"


class FeedbackSubmission(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    organization: Optional[str] = Field(None, max_length=150)
    role: Optional[str] = Field(None, max_length=100)
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)
    deployment: Deployment
    consent_public_display: bool = Field(
        ..., description="User must explicitly opt in to public display"
    )


class FeedbackRecord(FeedbackSubmission):
    id: str
    timestamp: str
    approved_for_display: bool = False  # manual moderation gate before public display


class FeedbackPublic(BaseModel):
    """What's actually shown publicly — no email, minimal PII."""
    name: Optional[str]
    organization: Optional[str]
    role: Optional[str]
    rating: int
    comment: Optional[str]
    deployment: Deployment
    timestamp: str


# --- Storage abstraction -----------------------------------------------
# Swap this for Firestore / Cloud SQL in production. Interface kept small
# so both Azure and GCP deployments can implement it consistently.

class FeedbackStore:
    async def save(self, record: FeedbackRecord) -> None:
        raise NotImplementedError

    async def list_approved(self, limit: int = 50) -> list[FeedbackRecord]:
        raise NotImplementedError

    async def list_all(self, limit: int = 200) -> list[FeedbackRecord]:
        raise NotImplementedError

    async def approve(self, feedback_id: str) -> None:
        raise NotImplementedError


class InMemoryFeedbackStore(FeedbackStore):
    """Placeholder store for local dev. Replace with Firestore/Cloud SQL impl."""

    def __init__(self):
        self._records: dict[str, FeedbackRecord] = {}

    async def save(self, record: FeedbackRecord) -> None:
        self._records[record.id] = record

    async def list_approved(self, limit: int = 50) -> list[FeedbackRecord]:
        approved = [r for r in self._records.values() if r.approved_for_display]
        return sorted(approved, key=lambda r: r.timestamp, reverse=True)[:limit]

    async def list_all(self, limit: int = 200) -> list[FeedbackRecord]:
        return sorted(
            self._records.values(), key=lambda r: r.timestamp, reverse=True
        )[:limit]

    async def approve(self, feedback_id: str) -> None:
        if feedback_id in self._records:
            self._records[feedback_id].approved_for_display = True


_store = InMemoryFeedbackStore()  # swap with real implementation


def get_store() -> FeedbackStore:
    return _store


# --- Routes --------------------------------------------------------------

@router.post("", response_model=FeedbackRecord, status_code=201)
async def submit_feedback(
    submission: FeedbackSubmission,
    store: FeedbackStore = Depends(get_store),
) -> FeedbackRecord:
    record = FeedbackRecord(
        id=str(uuid4()),
        timestamp=datetime.now(timezone.utc).isoformat(),
        approved_for_display=False,  # requires manual moderation before going public
        **submission.model_dump(),
    )
    await store.save(record)
    return record


@router.get("/public", response_model=list[FeedbackPublic])
async def list_public_feedback(
    limit: int = 50,
    store: FeedbackStore = Depends(get_store),
) -> list[FeedbackPublic]:
    """Public endpoint — only approved, non-sensitive fields returned."""
    records = await store.list_approved(limit=limit)
    return [
        FeedbackPublic(
            name=r.name,
            organization=r.organization,
            role=r.role,
            rating=r.rating,
            comment=r.comment,
            deployment=r.deployment,
            timestamp=r.timestamp,
        )
        for r in records
    ]


@router.get("/admin/all", response_model=list[FeedbackRecord])
async def list_all_feedback(
    limit: int = 200,
    store: FeedbackStore = Depends(get_store),
    # TODO: add real auth dependency here before deploying —
    # this must not be publicly accessible as-is.
) -> list[FeedbackRecord]:
    return await store.list_all(limit=limit)


@router.post("/admin/{feedback_id}/approve", status_code=204)
async def approve_feedback(
    feedback_id: str,
    store: FeedbackStore = Depends(get_store),
    # TODO: same auth requirement as above
) -> None:
    await store.approve(feedback_id)