from sqlmodel import select
from fastapi import WebSocket, APIRouter
from starlette.websockets import WebSocketDisconnect
from database import SessionDep
from models import User
import random

from utils import emailToColor

router = APIRouter(prefix="/ws")

class ConnectionManager:

    def __init__(self):
        self.rooms: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, roomId: str, userId: str, websocket: WebSocket):
        await websocket.accept()
        if roomId not in self.rooms:
            self.rooms[roomId] = {}
        self.rooms[roomId][userId] = websocket
        print(f"User {userId} joined room {roomId}", flush=True)

    def disconnect(self, roomId: str, userId: str):
        if roomId in self.rooms and userId in self.rooms[roomId]:
            del self.rooms[roomId][userId]

            if not self.rooms[roomId]:
                del self.rooms[roomId]
        print(f"User {userId} left room {roomId}")

    async def broadcast_to_room(self, roomId: str, message: dict):
        if roomId in self.rooms:
            for websocket in self.rooms[roomId].values():
                await websocket.send_json(message)

    def print_rooms(self):
        print(self.rooms)

manager = ConnectionManager()

@router.websocket("/{roomId}/{userId}")
async def websocketEndpoint(websocket: WebSocket, roomId: str, userId: str, session: SessionDep):
    await manager.connect(roomId, userId,websocket)
    usersId = manager.rooms[roomId].keys()
    statement = select(User).where(User.id.in_(usersId))
    users = session.execute(statement).scalars().all()

    serializableUsers = [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "color": emailToColor(user.email)
        }
        for user in users
    ]
    await manager.broadcast_to_room(roomId, {
        "users": serializableUsers,
        "type": "USER_CONNECTION",
    })
    try:
        while True:
            data = await websocket.receive_json()
            print(data)
            if(data["type"] == "COORDS"):
                await manager.broadcast_to_room(roomId, {
                    "data": data,
                    "type": "USER_COORDS"
                })
            elif(data["type"] == "LINE"):
                await manager.broadcast_to_room(roomId, {
                    "data": data,
                    "type": "ADD_LINE"
                })
            elif(data["type"] == "UNDO_LINE"):
                await manager.broadcast_to_room(roomId, {
                    "data": data,
                    "type": "UNDO_LINE"
                })
            elif(data["type"] == "REDO_LINE"):
                await manager.broadcast_to_room(roomId, {
                    "data": data,
                    "type": "REDO_LINE"
                })
            elif(data["type"] == "CLEAR_LINES"):
                await manager.broadcast_to_room(roomId, {
                    "data": data,
                    "type": "CLEAR_LINES"
                })


    except WebSocketDisconnect:
        manager.disconnect(roomId, userId)
        await manager.broadcast_to_room(roomId, {
            "users": serializableUsers,
            "type": "USER_CONNECTION",
        })

def printUsers():
    manager.print_rooms()