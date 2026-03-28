from fastapi import APIRouter
from app.services.scheduler import scheduler
from app.core.redis_client import get_redis

router = APIRouter()


@router.get("/")
async def analytics():
    r = get_redis()
    listeners = await scheduler.get_listener_count()
    history   = await scheduler.get_play_history(limit=10)
    total_plays = await r.llen("station:history")

    return {
        "current_listeners": listeners,
        "total_plays_tracked": total_plays,
        "recent_history": history,
    }
