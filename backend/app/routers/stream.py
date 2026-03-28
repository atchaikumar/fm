from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from app.core.config import settings

router = APIRouter()


@router.get("/listen")
async def listen():
    """Redirect to the live Icecast stream."""
    stream_url = (
        f"http://{settings.ICECAST_HOST}:{settings.ICECAST_PORT}{settings.ICECAST_MOUNT}"
    )
    return RedirectResponse(url=stream_url)


@router.get("/info")
async def stream_info():
    return {
        "stream_url": f"http://{settings.ICECAST_HOST}:{settings.ICECAST_PORT}{settings.ICECAST_MOUNT}",
        "format": "audio/mpeg",
        "bitrate": "128kbps",
        "station": settings.STATION_NAME,
    }
