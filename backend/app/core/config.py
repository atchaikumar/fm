from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI FM Radio"
    DEBUG: bool = False

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:4200"]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./fm_radio.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # Ollama (Local LLM)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "conceptsintamil/tamil-llama-7b-instruct-v0.2"
    USE_OLLAMA: bool = True

    # ElevenLabs (TTS for AI DJ)
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "pNInz6obpgDQGcFmaJgB"  # default: Adam

    # Anthropic (optional secondary LLM)
    ANTHROPIC_API_KEY: str = ""

    # Suno / Music generation
    SUNO_API_KEY: str = ""

    # Audio stream
    ICECAST_HOST: str = "localhost"
    ICECAST_PORT: int = 8000
    ICECAST_MOUNT: str = "/radio"
    ICECAST_PASSWORD: str = "hackme"

    # Station identity
    STATION_NAME: str = "AI·FM தமிழ்"
    STATION_TAGLINE: str = "உங்களின் குரல், உங்களின் இசை"
    DEFAULT_GENRE: str = "தமிழ் ஹிட்ஸ்"
    DJ_NAME: str = "RJ Anbu"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
