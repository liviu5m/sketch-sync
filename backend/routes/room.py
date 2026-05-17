from fastapi import APIRouter, HTTPException,WebSocket
from fastapi.params import Depends
from sqlalchemy import select
from database import SessionDep
from models import Room
from utils import loginHandler

router = APIRouter(prefix="/api/room", tags=["rooms"], dependencies=[Depends(loginHandler)])

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

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message text was: {data}")