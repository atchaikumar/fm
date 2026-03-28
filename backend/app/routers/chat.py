from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, AsyncSessionLocal
from app.core.redis_client import get_redis, CHANNEL_CHAT
from app.models.chat import ChatMessage
from app.services.ai_dj import ai_dj
from app.services.scheduler import scheduler
import asyncio, json, random
from datetime import datetime, timezone

router = APIRouter()

# Track active chat WebSocket connections
_connections: list[WebSocket] = []


@router.get("/messages")
async def get_messages(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(limit)
    )
    rows = result.scalars().all()
    return [
        {
            "id": m.id,
            "username": m.username,
            "message": m.message,
            "is_ai": m.is_ai,
            "created_at": m.created_at.isoformat(),
        }
        for m in reversed(rows)
    ]


async def _broadcast(payload: dict):
    """Broadcast a message to all connected chat WebSocket clients."""
    dead = []
    for ws in _connections:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _connections.remove(ws)


async def _maybe_dj_reaction(message: str, username: str):
    """Randomly have the AI DJ react to a chat message (20% chance)."""
    if random.random() > 0.20:
        return
    try:
        script = await ai_dj.generate_chat_reaction(f"{username}: {message}")

        async with AsyncSessionLocal() as db:
            dj_msg = ChatMessage(username="DJ Nova 🎙", message=script, is_ai=True)
            db.add(dj_msg)
            await db.commit()
            await db.refresh(dj_msg)

            await _broadcast({
                "event": "chat",
                "data": {
                    "id": dj_msg.id,
                    "username": dj_msg.username,
                    "message": dj_msg.message,
                    "is_ai": True,
                    "created_at": dj_msg.created_at.isoformat(),
                },
            })
    except Exception as exc:
        print(f"[Chat] DJ reaction failed: {exc}")


@router.websocket("/ws")
async def chat_ws(websocket: WebSocket):
    await websocket.accept()
    _connections.append(websocket)
    try:
        async for raw in websocket.iter_text():
            payload = json.loads(raw)
            username = payload.get("username", "Listener")
            message  = payload.get("message", "").strip()
            if not message:
                continue

            async with AsyncSessionLocal() as db:
                msg = ChatMessage(username=username, message=message, is_ai=False)
                db.add(msg)
                await db.commit()
                await db.refresh(msg)

                out = {
                    "event": "chat",
                    "data": {
                        "id": msg.id,
                        "username": msg.username,
                        "message": msg.message,
                        "is_ai": False,
                        "created_at": msg.created_at.isoformat(),
                    },
                }
                await _broadcast(out)
                asyncio.create_task(_maybe_dj_reaction(message, username))
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in _connections:
            _connections.remove(websocket)
