import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.core.redis_client import init_redis
from app.routers import station, chat, requests, analytics, stream
from app.workers.dj_worker import process_dj_queue
from app.services.music_gen import music_gen


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await init_redis()          # connects Redis or falls back to memory
    
    # Bootstrap AI music if needed
    asyncio.create_task(music_gen.bootstrap_station(count=3))
    
    dj_task = asyncio.create_task(process_dj_queue())
    yield
    # Shutdown
    dj_task.cancel()
    try:
        await dj_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="AI FM Radio Station API",
    description="AI-powered FM radio station backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(station.router,   prefix="/api/station",   tags=["Station"])
app.include_router(chat.router,      prefix="/api/chat",      tags=["Chat"])
app.include_router(requests.router,  prefix="/api/requests",  tags=["Song Requests"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(stream.router,    prefix="/api/stream",    tags=["Stream"])


@app.get("/health")
async def health():
    return {"status": "on-air", "version": "1.0.0"}