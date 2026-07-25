# routes/users.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from auth.firebase_auth import get_current_user, AuthenticatedUser
from db import get_db_connection  # your Cloud SQL connection helper

router = APIRouter(prefix="/users", tags=["users"])


class UserProfileCreate(BaseModel):
    display_name: str = Field(..., max_length=255)
    organization: str | None = Field(None, max_length=255)
    role: str | None = Field(None, max_length=100)


@router.post("/profile", status_code=201)
async def create_user_profile(
    payload: UserProfileCreate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Called once, immediately after Firebase signup succeeds on the
    frontend, to create the matching Cloud SQL profile row.
    Idempotent: safe to call again on sign-in (upserts last_login_at).
    """
    conn = await get_db_connection()
    try:
        await conn.execute(
            """
            INSERT INTO users (firebase_uid, email, display_name, organization,
                                role, sign_in_provider, created_at, last_login_at)
            VALUES ($1, $2, $3, $4, $5, $6, now(), now())
            ON CONFLICT (firebase_uid)
            DO UPDATE SET last_login_at = now()
            """,
            user.uid, user.email, payload.display_name,
            payload.organization, payload.role,
            "google.com" if not payload.role else "password",
        )
    finally:
        await conn.close()
    return {"status": "ok"}


@router.get("/profile/me")
async def get_my_profile(user: AuthenticatedUser = Depends(get_current_user)):
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            "SELECT * FROM users WHERE firebase_uid = $1", user.uid
        )
        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")
        return dict(row)
    finally:
        await conn.close()