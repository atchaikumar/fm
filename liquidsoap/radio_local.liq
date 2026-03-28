#!/usr/bin/liquidsoap

# Enable Telnet server for metadata updates (optional)
set("server.telnet.bind_addr", "127.0.0.1")
set("server.telnet.port", 1234)

# Define paths using WSL mounts to your Windows D: drive
music_dir = "/mnt/d/fm/ai-fm-radio/backend/audio/music"
announcements_dir = "/mnt/d/fm/ai-fm-radio/backend/audio/announcements"

# Create fallback audio to prevent station from crashing linearly
fallback_audio = blank(duration=1.)

# Load the AI-generated or requested music
radio = playlist(music_dir, mode="normal", reload_mode="watch")

# Crossfade between songs smoothly (using defaults to avoid version API issues)
radio = crossfade(radio)

# Add a cue point for DJ announcements
dj_voice = fallback([request.queue(id="dj_queue"), blank(duration=1.)])

# Overlay or transition? Usually, an RJ speaks OVER the intro/outro, or between tracks.
# For simplicity, we interrupt with the DJ, then resume music.
radio = fallback(track_sensitive=false, [dj_voice, radio, fallback_audio])

# Add some basic audio processing (compressor/limiter for that "radio" sound)
radio = sky(radio)

# Output stream to Icecast
output.icecast(
    %mp3(bitrate=128),
    host="127.0.0.1",
    port=8080,
    password="hackme",
    mount="radio",
    name="AI FM 99.9",
    description="Your 24/7 AI DJ",
    genre="Chill",
    radio
)
