"""Live updates — in-process WebSocket connection manager.

A single broadcast manager keeps a set of connected clients per institution.
The server publishes events when:
- An application stage changes (PATCH /api/applications/{id})
- An interview is scheduled / cancelled
- An announcement is posted

Clients connect with `?institution_id=...&token=...` (the session cookie can't be
read in browser WebSocket headers, so we accept the session_token as a query param).
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Dict, Set, Any

from fastapi import WebSocket

log = logging.getLogger("ws")


class ConnectionManager:
    def __init__(self) -> None:
        self._rooms: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, room: str, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._rooms.setdefault(room, set()).add(ws)
        log.info("WS connect → %s (n=%d)", room, len(self._rooms.get(room, [])))

    async def disconnect(self, room: str, ws: WebSocket) -> None:
        async with self._lock:
            self._rooms.get(room, set()).discard(ws)
        log.info("WS disconnect ← %s (n=%d)", room, len(self._rooms.get(room, [])))

    async def broadcast(self, room: str, payload: Dict[str, Any]) -> int:
        message = json.dumps(payload, default=str)
        dead: list[WebSocket] = []
        targets = list(self._rooms.get(room, set()))
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:  # noqa: BLE001
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    self._rooms.get(room, set()).discard(ws)
        return len(targets) - len(dead)


# Global instance
manager = ConnectionManager()
