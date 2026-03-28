from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from app.core.database import get_db
from app.models.chat import SongRequest, RequestStatus
from app.services.ai_dj import ai_dj
from datetime import datetime, timezone

router = APIRouter()


class SongRequestIn(BaseModel):
    requester: str
    song_title: str
    artist: str = ""
    note: str = ""

class RequestStatusUpdate(BaseModel):
    status: RequestStatus

@router.post("/")
async def submit_request(body: SongRequestIn, db: AsyncSession = Depends(get_db)):
    req = SongRequest(
        requester=body.requester,
        song_title=body.song_title,
        artist=body.artist,
        note=body.note,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)

    # Generate AI DJ acknowledgement asynchronously
    try:
        ack = await ai_dj.generate_request_acknowledgement(
            requester=body.requester,
            title=body.song_title,
            artist=body.artist,
            note=body.note,
        )
        req.ai_response = ack
        req.status = RequestStatus.approved
        await db.commit()
    except Exception:
        pass

    return {
        "id": req.id,
        "status": req.status,
        "ai_response": req.ai_response,
        "message": "Your request has been received!",
    }


@router.get("/")
async def list_requests(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SongRequest)
        .where(SongRequest.status != RequestStatus.rejected)
        .order_by(SongRequest.created_at.desc())
        .limit(20)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "requester": r.requester,
            "song_title": r.song_title,
            "artist": r.artist,
            "note": r.note,
            "status": r.status,
            "ai_response": r.ai_response,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]

@router.patch("/{request_id}")
async def update_request_status(
    request_id: str, body: RequestStatusUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SongRequest).where(SongRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = body.status
    if body.status == RequestStatus.playing:
        req.played_at = datetime.now(timezone.utc)
    
    await db.commit()
    return {"id": request_id, "status": body.status}
