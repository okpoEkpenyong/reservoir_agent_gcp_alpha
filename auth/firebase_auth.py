# auth/firebase_auth.py

"""
Verifies Google Identity Platform (Firebase Auth) ID tokens sent from
the frontend. Supports both email/password and Google OAuth sign-in,
since Identity Platform issues the same token format for both.
"""

from fastapi import Header, HTTPException, Depends
from firebase_admin import auth as firebase_auth, initialize_app, credentials
import os

# Initialize once at startup — use Application Default Credentials on Cloud Run,
# or a service account key locally.
if not os.getenv("FIREBASE_INITIALIZED"):
    initialize_app()
    os.environ["FIREBASE_INITIALIZED"] = "true"


class AuthenticatedUser:
    def __init__(self, uid: str, email: str | None, email_verified: bool):
        self.uid = uid
        self.email = email
        self.email_verified = email_verified


async def get_current_user(
    authorization: str = Header(..., description="Bearer <ID token>")
) -> AuthenticatedUser:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return AuthenticatedUser(
        uid=decoded["uid"],
        email=decoded.get("email"),
        email_verified=decoded.get("email_verified", False),
    )


async def get_optional_user(
    authorization: str | None = Header(None)
) -> AuthenticatedUser | None:
    """For routes where auth is optional (e.g. feedback stays open)."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None