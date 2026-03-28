from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.scheduler import scheduler
from app.core.redis_client import get_redis, CHANNEL_NOW_PLAYING
import asyncio, json

router = APIRouter()


@router.get("/now-playing")
async def now_playing():
    track = await scheduler.get_now_playing()
    track["listeners"] = await scheduler.get_listener_count()
    return track


@router.get("/history")
async def play_history(limit: int = 10):
    return await scheduler.get_play_history(limit=limit)


@router.post("/next")
async def force_next():
    """Force advance to the next track (admin / demo)."""
    track = await scheduler.advance_to_next_track()
    return {"status": "advanced", "track": track}


# ------------------------------------------------------------------ #
# WebSocket – real-time now-playing push                              #
# ------------------------------------------------------------------ #

@router.websocket("/ws")
async def station_ws(websocket: WebSocket):
    await websocket.accept()
    await scheduler.increment_listeners()
    r = get_redis()
    pubsub = r.pubsub()
    await pubsub.subscribe(CHANNEL_NOW_PLAYING)

    try:
        # Send current state immediately on connect
        now = await scheduler.get_now_playing()
        now["listeners"] = await scheduler.get_listener_count()
        await websocket.send_json({"event": "now_playing", "data": now})

        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                data["listeners"] = await scheduler.get_listener_count()
                await websocket.send_json({"event": "now_playing", "data": data})
    except WebSocketDisconnect:
        pass
    finally:
        await scheduler.decrement_listeners()
        await pubsub.unsubscribe(CHANNEL_NOW_PLAYING)
        await pubsub.close()
