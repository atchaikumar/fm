import httpx
import os
import asyncio
import uuid

class MusicGenService:
    """
    Downloads copyright-free tracks from public sources and saves them
    to the /audio/music directory for Liquidsoap, since free HF inference 
    is currently rate-limited or unavailable.
    """
    
    def __init__(self):
        # Use relative path so it creates inside backend/audio/music
        self.music_dir = "audio/music"
        os.makedirs(self.music_dir, exist_ok=True)

    async def bootstrap_station(self, count: int = 3):
        """
        Downloads placeholder tracks to ensure the station can play.
        """
        existing_files = [f for f in os.listdir(self.music_dir) if f.endswith(('.mp3', '.wav'))]
        if len(existing_files) >= count:
            return

        print(f"[MusicGen] Bootstrapping station with {count - len(existing_files)} free instrumental tracks...")
        
        # Public, royalty-free background/lofi tracks direct MP3 URLs
        # Using stable links from freemusicarchive or typical public sources. 
        # For completely stable demo, we will use known Wikimedia Commons audio files.
        tracks_to_download = [
            "https://upload.wikimedia.org/wikipedia/commons/e/ea/The_Entertainer_-_Scott_Joplin_%281902_piano_roll%29.ogg",
            "https://upload.wikimedia.org/wikipedia/commons/1/18/Gymnopedie_No_1.ogg",
            "https://upload.wikimedia.org/wikipedia/commons/f/fb/Hungarian_Dance_No._5_%28Brahms%29.ogg"
        ][:count]

        async with httpx.AsyncClient(timeout=60, headers={"User-Agent": "AIFMRadioApp/1.0"}) as client:
            for url in tracks_to_download:
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    filename = f"track_{uuid.uuid4().hex[:8]}.ogg"
                    filepath = os.path.join(self.music_dir, filename)
                    with open(filepath, "wb") as f:
                        f.write(resp.content)
                    print(f"[MusicGen] Downloaded: {filename}")
                except Exception as e:
                    print(f"[MusicGen] Failed to download {url}: {e}")

music_gen = MusicGenService()
