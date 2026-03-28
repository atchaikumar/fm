# 🎙 AI FM Radio Station

An AI-powered FM radio station with a live DJ, real-time chat, song requests, multi-channel support, and a listener analytics dashboard.

---

## Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | Angular 18 · Tailwind CSS               |
| Backend   | Python 3.12 · FastAPI · SQLAlchemy      |
| Realtime  | WebSockets · Redis Pub/Sub              |
| Audio     | Icecast2 · Liquidsoap · FFmpeg          |
| AI DJ     | LLM (GPT-4o / Claude) + ElevenLabs TTS |
| AI Music  | Suno / Udio (plug in API key)           |
| Database  | SQLite (dev) · PostgreSQL (prod)        |
| Container | Docker Compose                          |

---

## Architecture

```
Angular (4200) ──HTTP/WS──► FastAPI (8000)
                                │
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
           Redis            SQLite/PG         AI Services
         (pub/sub)         (tracks,         (OpenAI, ElevenLabs,
          queues)           chat, req)        Suno)
              │
              ▼
         Liquidsoap ──────► Icecast2 (:8080)
         (scheduler)         (audio stream)
              │
              ▼
         /audio/music        ← drop MP3s here
         /audio/announcements ← DJ TTS clips (auto)
         /audio/jingles       ← station IDs
```

---

## Quick Start

### 1. Clone & configure

```bash
git clone <your-repo>
cd ai-fm-radio

cp backend/.env.example backend/.env
# Edit backend/.env — add your API keys
```

### 2. Run with Docker Compose (recommended)

```bash
docker-compose up --build
```

| Service      | URL                             |
|--------------|---------------------------------|
| Frontend     | http://localhost:4200            |
| API docs     | http://localhost:8000/docs       |
| Icecast admin| http://localhost:8080/admin      |
| Audio stream | http://localhost:8080/radio      |

### 3. Run locally (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # fill in your API keys

# Start Redis separately
redis-server

# Start FastAPI
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start                          # serves on http://localhost:4200
```

---

## Features

### 🎵 Now Playing
- Real-time track info pushed via WebSocket
- Animated progress bar
- Listener count
- Play/pause controls for the live stream

### 🤖 AI DJ (DJ Nova)
- Generates track intros using GPT-4o
- Speaks them via ElevenLabs TTS
- Reacts to live chat messages (20% chance per message)
- Personalises song request acknowledgements
- Clips are queued in Redis → Liquidsoap plays them before each track

### 💬 Live Chat
- WebSocket-based real-time chat
- AI DJ randomly joins the conversation
- Message history persisted to DB

### 🎤 Song Requests
- Listeners submit requests with a personal note
- AI DJ generates a personalised on-air response
- Request queue visible to all listeners

### 📻 Multi-Channel
- 6 genre channels (Chill, Synthwave, Jazz, EDM, Classical, Hip-Hop)
- Each channel can have its own Icecast mount point and AI DJ voice

### 📊 Analytics
- Live listener count
- Total tracks played
- Recent play history

---

## Adding AI Music

### Suno API (when available)
1. Add `SUNO_API_KEY` to `.env`
2. Create `backend/app/services/music_gen.py` calling the Suno API
3. Save generated MP3s to `/audio/music/` — Liquidsoap picks them up automatically

### Drop-in MP3s
Simply place any MP3 files in `./audio/music/` and Liquidsoap will include them in rotation.

---

## Swapping AI Providers

Everything AI lives in `backend/app/services/ai_dj.py`. The `_call_llm()` method is the only place that calls an LLM. To switch providers:

- **Claude (Anthropic):** Replace the OpenAI call with `httpx` to `https://api.anthropic.com/v1/messages`
- **Local LLM (Ollama):** Point the URL at `http://localhost:11434/api/chat`
- **ElevenLabs → OpenAI TTS:** Replace `synthesize_speech()` with a call to `https://api.openai.com/v1/audio/speech`

---

## Project Structure

```
ai-fm-radio/
├── backend/
│   ├── app/
│   │   ├── core/          # config, database, redis
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── services/      # AI DJ, scheduler, audio pipeline
│   │   └── workers/       # DJ background task worker
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/app/
│   │   ├── core/services/ # Angular services (station, chat, requests, analytics)
│   │   ├── features/      # Pages: player, channels, requests, analytics
│   │   └── shared/        # Navbar
│   ├── Dockerfile
│   ├── nginx.conf
│   └── tailwind.config.js
│
├── liquidsoap/
│   └── radio.liq          # Audio scheduler script
├── icecast.xml             # Icecast2 config
└── docker-compose.yml
```

---

## Environment Variables

| Variable              | Description                        | Required |
|-----------------------|------------------------------------|----------|
| `OPENAI_API_KEY`      | GPT-4o for DJ scripts              | Yes      |
| `ELEVENLABS_API_KEY`  | TTS voice for DJ                   | Yes      |
| `ELEVENLABS_VOICE_ID` | Voice ID (default: Adam)           | No       |
| `ANTHROPIC_API_KEY`   | Claude as alternative LLM          | No       |
| `SUNO_API_KEY`        | AI music generation                | No       |
| `DATABASE_URL`        | SQLite (dev) / PostgreSQL (prod)   | No       |
| `REDIS_URL`           | Redis connection string            | No       |
| `ICECAST_PASSWORD`    | Liquidsoap→Icecast auth            | No       |
| `STATION_NAME`        | Displayed station name             | No       |

---

## Production Checklist

- [ ] Switch `DATABASE_URL` to PostgreSQL
- [ ] Set strong `ICECAST_PASSWORD` and `admin-password` in `icecast.xml`
- [ ] Point `ALLOWED_ORIGINS` to your real domain
- [ ] Use HTTPS + WSS (reverse proxy: Caddy or nginx)
- [ ] Set up object storage (S3) for generated audio files
- [ ] Configure horizontal scaling with Redis as the shared state bus
- [ ] Add rate limiting on the `/api/requests/` endpoint
