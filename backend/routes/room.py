from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from database import SessionDep
from models import Room

router = APIRouter(prefix="/api/room", tags=["rooms"])

@router.post("/")
def createRoom(session: SessionDep):
    room = Room()
    session.add(room)
    session.commit()
    session.refresh(room)
    return room

@router.get("/{code}")
def getRoom(code: str, session: SessionDep):
    stmt = select(Room).where(Room.code == code)
    room = session.exec(stmt).first()
    if not room :
        raise HTTPException(status_code=404, detail="Room not found")
    return "Successfully founded"