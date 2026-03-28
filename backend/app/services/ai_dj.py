import httpx
import json
from app.core.config import settings


class AIDJService:
    """
    Generates spoken DJ announcements using an LLM for the script
    and gTTS for free text-to-speech.
    """

    SYSTEM_PROMPT = (
        "நீ ஒரு உற்சாகமான தமிழ் வானொலி தொகுப்பாளர் (RJ). உன் பெயர் {name}. "
        "நீ {station} நிலையத்தில் பேசுகிறாய். உன் பேச்சு கலகலப்பாகவும், "
        "நேயர்களை ஈர்க்கும் வகையிலும் இருக்க வேண்டும். "
        "உன் பதில்கள் 60 வார்த்தைகளுக்கு மிகாமல் இருக்கட்டும். எமோஜிகள் வேண்டாம். "
        "தமிழ் மொழியில் மட்டும் பதிலளிக்கவும்."
    )

    # ------------------------------------------------------------------ #
    # LLM script generation                                               #
    # ------------------------------------------------------------------ #

    async def generate_track_intro(self, title: str, artist: str, genre: str) -> str:
        prompt = (
            f"Introduce the next track: '{title}' by {artist} (genre: {genre}). "
            "Make it exciting and natural for FM radio."
        )
        return await self._call_llm(prompt)

    async def generate_chat_reaction(self, chat_snippet: str) -> str:
        prompt = (
            f"A listener just said: '{chat_snippet}'. "
            "Respond on-air briefly, then transition back to the music."
        )
        return await self._call_llm(prompt)

    async def generate_request_acknowledgement(
        self, requester: str, title: str, artist: str, note: str
    ) -> str:
        prompt = (
            f"Listener '{requester}' requested '{title}' by {artist}. "
            f"Their note: '{note}'. Acknowledge it warmly on air."
        )
        return await self._call_llm(prompt)

    async def generate_station_id(self) -> str:
        prompt = (
            f"Record a quick {settings.STATION_NAME} station ID. "
            "Mention the station name and tagline naturally."
        )
        return await self._call_llm(prompt)

    # ------------------------------------------------------------------ #
    # TTS – gTTS (Google TTS)                                             #
    # ------------------------------------------------------------------ #

    async def synthesize_speech(self, text: str) -> bytes:
        """Use gTTS to generate Tamil speech and return raw MP3 bytes."""
        from io import BytesIO
        from gtts import gTTS
        import asyncio

        def _generate():
            # 'ta' is the language code for Tamil
            tts = gTTS(text=text, lang="ta")
            fp = BytesIO()
            tts.write_to_fp(fp)
            return fp.getvalue()

        return await asyncio.to_thread(_generate)

    # ------------------------------------------------------------------ #
    # Internal LLM call                                                   #
    # ------------------------------------------------------------------ #

    async def _call_llm(self, user_prompt: str) -> str:
        system = self.SYSTEM_PROMPT.format(
            name=settings.DJ_NAME, station=settings.STATION_NAME
        )

        if settings.USE_OLLAMA:
            return await self._call_ollama(system, user_prompt)
        
        return await self._call_openai(system, user_prompt)

    async def _call_ollama(self, system: str, user_prompt: str) -> str:
        """Call local Ollama API."""
        url = f"{settings.OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": user_prompt},
            ],
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"].strip()

    async def _call_openai(self, system: str, user_prompt: str) -> str:
        """Original OpenAI fallback."""
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": user_prompt},
            ],
            "max_tokens": 120,
            "temperature": 0.85,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()


ai_dj = AIDJService()
