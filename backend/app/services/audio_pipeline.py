"""
AudioPipelineService
────────────────────
Connects FastAPI to Liquidsoap via its telnet socket.
When the AI DJ generates a new announcement (TTS MP3),
this service saves the file and pushes it into Liquidsoap's
dj_queue so it plays next.
"""
import asyncio
import os
import uuid
from pathlib import Path

from app.core.config import settings

AUDIO_DIR        = Path("/app/audio")
ANNOUNCEMENTS_DIR = AUDIO_DIR / "announcements"
MUSIC_DIR        = AUDIO_DIR / "music"
JINGLES_DIR      = AUDIO_DIR / "jingles"

LIQUIDSOAP_HOST  = "liquidsoap"
LIQUIDSOAP_PORT  = 1234


class AudioPipelineService:

    def __init__(self):
        for d in (ANNOUNCEMENTS_DIR, MUSIC_DIR, JINGLES_DIR):
            d.mkdir(parents=True, exist_ok=True)

    # ── Save TTS bytes to disk ────────────────────────────────────────
    async def save_announcement(self, audio_bytes: bytes, label: str = "dj") -> Path:
        filename = f"{label}_{uuid.uuid4().hex[:8]}.mp3"
        path = ANNOUNCEMENTS_DIR / filename
        path.write_bytes(audio_bytes)
        return path

    # ── Push to Liquidsoap request queue ─────────────────────────────
    async def push_to_liquidsoap(self, file_path: Path) -> bool:
        """
        Sends a `dj_queue.push <path>` command to Liquidsoap telnet.
        Returns True on success.
        """
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(LIQUIDSOAP_HOST, LIQUIDSOAP_PORT),
                timeout=5,
            )
            cmd = f"dj_queue.push {file_path}\n"
            writer.write(cmd.encode())
            await writer.drain()
            response = await asyncio.wait_for(reader.read(256), timeout=3)
            writer.close()
            await writer.wait_closed()
            return b"queued" in response.lower() or b"ok" in response.lower()
        except Exception as exc:
            print(f"[AudioPipeline] Liquidsoap push failed: {exc}")
            return False

    # ── High-level: save + push ───────────────────────────────────────
    async def queue_announcement(self, audio_bytes: bytes, label: str = "dj") -> bool:
        path = await self.save_announcement(audio_bytes, label)
        return await self.push_to_liquidsoap(path)

    # ── List available music tracks ───────────────────────────────────
    def list_music_files(self) -> list[str]:
        return [f.name for f in MUSIC_DIR.glob("*.mp3")]


audio_pipeline = AudioPipelineService()
