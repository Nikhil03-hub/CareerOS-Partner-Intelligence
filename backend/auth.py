"""Auth utilities — bcrypt password hashing + RBAC dependency."""
from __future__ import annotations

import bcrypt
from fastapi import Depends, HTTPException, Request
from datetime import datetime, timezone

from typing import Optional


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


async def get_session_user(request: Request):
    """Local import to avoid circular import with server.py."""
    from server import db
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(401, "Invalid session")
    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired")
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def require_roles(*roles: str):
    async def _dep(user=Depends(get_session_user)):
        if user["role"] not in roles:
            raise HTTPException(403, f"Forbidden — requires {','.join(roles)}")
        if user["role"] not in ("super_admin",) and not user.get("approved", False):
            raise HTTPException(403, "Account pending approval")
        return user
    return _dep


def require_same_institution(target_institution_id: Optional[str], user: dict) -> None:
    if user["role"] == "super_admin":
        return
    if target_institution_id and target_institution_id != user.get("institution_id"):
        raise HTTPException(403, "Cross-institution access denied")
