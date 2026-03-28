from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


def gen_uuid():
    return str(uuid.uuid4())


class Track(Base):
    __tablename__ = "tracks"

    id          = Column(String, primary_key=True, default=gen_uuid)
    title       = Column(String(255), nullable=False)
    artist      = Column(String(255), nullable=False)
    genre       = Column(String(100))
    duration_s  = Column(Integer)
    file_path   = Column(String(500))
    stream_url  = Column(String(500))
    ai_generated = Column(Boolean, default=False)
    play_count  = Column(Integer, default=0)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class PlayHistory(Base):
    __tablename__ = "play_history"

    id         = Column(String, primary_key=True, default=gen_uuid)
    track_id   = Column(String, nullable=False)
    track_title = Column(String(255))
    track_artist = Column(String(255))
    played_at  = Column(DateTime(timezone=True), server_default=func.now())
    listeners  = Column(Integer, default=0)


class DJAnnouncement(Base):
    __tablename__ = "dj_announcements"

    id         = Column(String, primary_key=True, default=gen_uuid)
    text       = Column(Text, nullable=False)
    audio_url  = Column(String(500))
    played_at  = Column(DateTime(timezone=True), server_default=func.now())
    trigger    = Column(String(100))  # 'track_intro', 'chat_reaction', 'news'
