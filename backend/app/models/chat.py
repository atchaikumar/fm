from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum


def gen_uuid():
    return str(uuid.uuid4())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(String, primary_key=True, default=gen_uuid)
    username   = Column(String(100), nullable=False)
    message    = Column(Text, nullable=False)
    is_ai      = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RequestStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    playing  = "playing"
    rejected = "rejected"


class SongRequest(Base):
    __tablename__ = "song_requests"

    id          = Column(String, primary_key=True, default=gen_uuid)
    requester   = Column(String(100), nullable=False)
    song_title  = Column(String(255), nullable=False)
    artist      = Column(String(255))
    note        = Column(Text)
    status      = Column(Enum(RequestStatus), default=RequestStatus.pending)
    ai_response = Column(Text)  # DJ personalised response
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    played_at   = Column(DateTime(timezone=True))
