import asyncio
import json
import random
from datetime import datetime, timezone

from app.core.config import settings
from app.core.redis_client import get_redis, CHANNEL_NOW_PLAYING, QUEUE_DJ_QUEUE
from app.services.ai_dj import ai_dj


class StationScheduler:
    """
    Manages the station's on-air schedule:
    - Pulls next track from Redis queue (or selects random from DB)
    - Triggers AI DJ intro before each track
    - Publishes now-playing metadata to all listeners via Redis pub/sub
    """

    def __init__(self):
        self._running = False
        self._current_track: dict | None = None

    # ------------------------------------------------------------------ #
    # Now-playing state                                                   #
    # ------------------------------------------------------------------ #

    async def get_now_playing(self) -> dict:
        r = get_redis()
        raw = await r.get("station:now_playing")
        if raw:
            return json.loads(raw)
        return {
            "title": "Station Starting…",
            "artist": settings.STATION_NAME,
            "genre": settings.DEFAULT_GENRE,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "duration_s": 0,
            "listeners": 0,
        }

    async def set_now_playing(self, track: dict):
        r = get_redis()
        track["started_at"] = datetime.now(timezone.utc).isoformat()
        await r.set("station:now_playing", json.dumps(track))
        await r.publish(CHANNEL_NOW_PLAYING, json.dumps(track))
        self._current_track = track

    # ------------------------------------------------------------------ #
    # Listener count                                                      #
    # ------------------------------------------------------------------ #

    async def get_listener_count(self) -> int:
        r = get_redis()
        count = await r.get("station:listeners")
        return int(count) if count else 0

    async def increment_listeners(self):
        r = get_redis()
        await r.incr("station:listeners")

    async def decrement_listeners(self):
        r = get_redis()
        count = await r.decr("station:listeners")
        if count < 0:
            await r.set("station:listeners", 0)

    # ------------------------------------------------------------------ #
    # Play history                                                        #
    # ------------------------------------------------------------------ #

    async def get_play_history(self, limit: int = 10) -> list[dict]:
        r = get_redis()
        raw_list = await r.lrange("station:history", 0, limit - 1)
        return [json.loads(x) for x in raw_list]

    async def push_history(self, track: dict):
        r = get_redis()
        await r.lpush("station:history", json.dumps(track))
        await r.ltrim("station:history", 0, 49)  # keep last 50

    # ------------------------------------------------------------------ #
    # AI DJ announcement queue                                            #
    # ------------------------------------------------------------------ #

    async def queue_dj_announcement(self, text: str, trigger: str = "auto"):
        r = get_redis()
        entry = json.dumps({"text": text, "trigger": trigger,
                            "queued_at": datetime.now(timezone.utc).isoformat()})
        await r.rpush(QUEUE_DJ_QUEUE, entry)

    async def generate_track_intro_and_queue(self, track: dict):
        """Generate an AI DJ intro for the upcoming track and add to queue."""
        try:
            script = await ai_dj.generate_track_intro(
                title=track["title"],
                artist=track["artist"],
                genre=track.get("genre", settings.DEFAULT_GENRE),
            )
            await self.queue_dj_announcement(script, trigger="track_intro")
        except Exception as exc:
            print(f"[Scheduler] DJ intro generation failed: {exc}")

    # ------------------------------------------------------------------ #
    # Demo: simulate next track (replace with real DB/queue logic)       #
    # ------------------------------------------------------------------ #

    async def advance_to_next_track(self) -> dict:
        demo_tracks = [
            {"title": "Midnight Circuit",   "artist": "Neon Pulse",    "genre": "Synthwave", "duration_s": 210},
            {"title": "Aurora Waves",        "artist": "Stellar Drift", "genre": "Ambient",   "duration_s": 185},
            {"title": "Digital Rain",        "artist": "ByteForest",    "genre": "Lo-Fi",     "duration_s": 196},
            {"title": "Quantum Beat",        "artist": "Particle Wave", "genre": "Electronic","duration_s": 222},
        ]
        track = random.choice(demo_tracks)
        await self.push_history(self._current_track or track)
        await self.generate_track_intro_and_queue(track)
        await self.set_now_playing(track)
        return track


scheduler = StationScheduler()
