# -*- coding: utf-8 -*-
"""
WebSocket Real-Time Streaming Router.

Implements Phase 4 Component 1 from enhance.md:
- Live streaming of ticker quotes and IV rank updates
- Real-time risk circuit breaker notifications
- Sub-second options opportunity broadcast
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import List, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_json(self, data: dict):
        dead_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception:
                dead_connections.append(connection)
        for dc in dead_connections:
            self.active_connections.discard(dc)


manager = ConnectionManager()


@router.websocket("/stream")
async def websocket_options_stream(websocket: WebSocket):
    """
    Subscribes client to live screener updates, quote ticks, and circuit-breaker alerts.
    """
    await manager.connect(websocket)
    try:
        # Send initial welcome & heartbeat
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "channel": "options_screener_v1",
        })

        while True:
            # Listen for client ping / subscriptions
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_json({
                        "type": "PONG",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket exception: {e}")
        manager.disconnect(websocket)
