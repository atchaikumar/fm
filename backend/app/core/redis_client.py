"""
Redis client with in-memory fallback.
If Redis is not running, all operations use a local dict — 
perfect for development without Redis installed.
"""
import json
import asyncio
from typing import Any

# ── Try real Redis first ──────────────────────────────────────────────────
try:
    import redis.asyncio as redis
    _real_redis_available = True
except ImportError:
    _real_redis_available = False

from app.core.config import settings

CHANNEL_NOW_PLAYING = "radio:now_playing"
CHANNEL_CHAT        = "radio:chat"
CHANNEL_LISTENERS   = "radio:listeners"
QUEUE_SONG_REQUESTS = "queue:song_requests"
QUEUE_DJ_QUEUE      = "queue:dj_announcements"


# ── In-memory fallback store ──────────────────────────────────────────────
class MemoryStore:
    """Thread-safe in-memory Redis substitute for development."""

    def __init__(self):
        self._data: dict[str, Any] = {}
        self._lists: dict[str, list] = {}
        self._subscribers: dict[str, list] = {}

    async def get(self, key: str):
        return self._data.get(key)

    async def set(self, key: str, value: Any, ex=None):
        self._data[key] = value
        return True

    async def incr(self, key: str):
        val = int(self._data.get(key, 0)) + 1
        self._data[key] = str(val)
        return val

    async def decr(self, key: str):
        val = int(self._data.get(key, 0)) - 1
        self._data[key] = str(max(0, val))
        return val

    async def lpush(self, key: str, *values):
        if key not in self._lists:
            self._lists[key] = []
        for v in values:
            self._lists[key].insert(0, v)
        return len(self._lists[key])

    async def lrange(self, key: str, start: int, end: int):
        lst = self._lists.get(key, [])
        if end == -1:
            return lst[start:]
        return lst[start:end + 1]

    async def ltrim(self, key: str, start: int, end: int):
        lst = self._lists.get(key, [])
        self._lists[key] = lst[start:end + 1]

    async def llen(self, key: str):
        return len(self._lists.get(key, []))

    async def rpush(self, key: str, *values):
        if key not in self._lists:
            self._lists[key] = []
        for v in values:
            self._lists[key].append(v)
        return len(self._lists[key])

    async def blpop(self, key: str, timeout: int = 0):
        """Non-blocking: return item if exists, else sleep and return None."""
        lst = self._lists.get(key, [])
        if lst:
            item = lst.pop(0)
            return (key, item)
        await asyncio.sleep(min(timeout, 2) if timeout else 2)
        return None

    async def publish(self, channel: str, message: str):
        callbacks = self._subscribers.get(channel, [])
        for cb in callbacks:
            asyncio.create_task(cb(message))
        return len(callbacks)

    def pubsub(self):
        return MemoryPubSub(self)

    async def close(self):
        pass


class MemoryPubSub:
    def __init__(self, store: MemoryStore):
        self._store = store
        self._channel: str | None = None
        self._queue: asyncio.Queue = asyncio.Queue()

    async def subscribe(self, channel: str):
        self._channel = channel
        if channel not in self._store._subscribers:
            self._store._subscribers[channel] = []
        self._store._subscribers[channel].append(self._enqueue)

    async def _enqueue(self, message: str):
        await self._queue.put({"type": "message", "data": message})

    async def unsubscribe(self, channel: str):
        if channel in self._store._subscribers:
            try:
                self._store._subscribers[channel].remove(self._enqueue)
            except ValueError:
                pass

    async def listen(self):
        while True:
            try:
                msg = await asyncio.wait_for(self._queue.get(), timeout=30)
                yield msg
            except asyncio.TimeoutError:
                continue

    async def close(self):
        if self._channel:
            await self.unsubscribe(self._channel)


# ── Singleton ─────────────────────────────────────────────────────────────
_memory_store = MemoryStore()
_redis_client = None
_use_memory = False


async def _try_connect_redis():
    global _redis_client, _use_memory
    if not _real_redis_available:
        _use_memory = True
        return
    try:
        client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True,
                                      socket_connect_timeout=2)
        await client.ping()
        _redis_client = client
        _use_memory = False
        print("[Redis] Connected to Redis successfully.")
    except Exception:
        _use_memory = True
        print("[Redis] Redis not available — using in-memory store (development mode).")


async def init_redis():
    await _try_connect_redis()


def get_redis():
    if _use_memory:
        return _memory_store
    return _redis_client or _memory_store