"""
DJ Worker – background task
────────────────────────────
Polls the Redis DJ announcement queue, generates TTS audio via
ElevenLabs, and pushes each clip to Liquidsoap.

Start this as an asyncio task from main.py lifespan or run as a
separate process:  python -m app.workers.dj_worker
"""
import asyncio
import json

from app.core.redis_client import get_redis, QUEUE_DJ_QUEUE
from app.services.ai_dj import ai_dj
from app.services.audio_pipeline import audio_pipeline


async def process_dj_queue():
    r = get_redis()
    print("[DJWorker] Starting — polling Redis queue…")
    while True:
        try:
            # Blocking pop with 5 s timeout
            item = await r.blpop(QUEUE_DJ_QUEUE, timeout=5)
            if not item:
                continue

            _, raw = item
            entry = json.loads(raw)
            text    = entry.get("text", "")
            trigger = entry.get("trigger", "auto")

            if not text:
                continue

            print(f"[DJWorker] Synthesising: '{text[:60]}…' (trigger={trigger})")

            # TTS → bytes
            audio_bytes = await ai_dj.synthesize_speech(text)

            # Save + push to Liquidsoap
            ok = await audio_pipeline.queue_announcement(audio_bytes, label=trigger)
            print(f"[DJWorker] Queued to Liquidsoap: {'✓' if ok else '✗'}")

        except asyncio.CancelledError:
            print("[DJWorker] Shutting down.")
            break
        except Exception as exc:
            print(f"[DJWorker] Error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(process_dj_queue())
