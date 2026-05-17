from typing import Literal, Optional, List

from pydantic import BaseModel, Field
from sqlalchemy import delete
from sqlmodel import select
from fastapi import WebSocket, APIRouter, BackgroundTasks
from starlette.websockets import WebSocketDisconnect
from database import SessionDep
from models import User, Room
from collections import defaultdict
import asyncio
from database import get_background_session

from utils import emailToColor

router = APIRouter(prefix="/ws")
apiRouter = APIRouter(prefix="/socket")

class Shape(BaseModel):
    id: str
    tool: Literal["pen", "eraser", "rect", "circle"]
    points: List[float] = Field(default_factory=list)
    color: str = "#1A1A1B"
    strokeWidth: int = 2
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    radius: Optional[float] = None
    userId: int

class ConnectionManager:

    def __init__(self):
        self.rooms: dict[str, dict[str, WebSocket]] = {}
        self.lines: dict[str, List[Shape]] = defaultdict(list)
        self.monitors: List[WebSocket] = []

    async def connectMonitor(self, websocket: WebSocket):
        await websocket.accept()
        self.monitors.append(websocket)
        try:
            await websocket.send_json(self.getSocketData())
        except Exception:
            if websocket in self.monitors:
                self.monitors.remove(websocket)

    async def disconnectMonitor(self, websocket):
        self.monitors.remove(websocket)

    async def broadcastToMonitors(self):
        for monitor in self.monitors:
            try:
                await monitor.send_json(self.getSocketData())
            except:
                print("Failed to send to websocket monitor")

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
        tasks = []

        await asyncio.gather(*tasks)
        if roomId in self.rooms:
            for userId, websocket in self.rooms[roomId].items():
                tasks.append(self._send_safely(roomId, userId, websocket, message))
        await asyncio.gather(*tasks)

    async def broadcast_to_room_lines(self, roomId: str):
        if roomId in self.rooms:
            for websocket in self.rooms[roomId].values():
                try:
                    await websocket.send_json({"lines": self.lines[roomId], "type": "REFRESH_LINE"})
                except:
                    print("Failed websocket not available")

    async def checkRoom(self, roomId: str):
        await asyncio.sleep(5)
        if not roomId in self.rooms:
            with get_background_session() as session:
                stmt = delete(Room).where(Room.code == roomId)
                session.execute(stmt)
                session.commit()

    def addLine(self, roomId, data):
        shape_id = data.get("id")

        for index, existing_shape in enumerate(self.lines[roomId]):
            if existing_shape.get("id") == shape_id:
                self.lines[roomId][index] = data
                return

        self.lines[roomId].append(data)

    def getSocketData(self):
        return {
            "rooms": len(self.rooms),
            "users": sum(len(users) for users in self.rooms.values())
        }

    async def _send_safely(self, roomId: str, userId: str, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect(roomId, userId)



manager = ConnectionManager()

@router.websocket("/data")
async def getData(websocket: WebSocket):
    await manager.connectMonitor(websocket)
    try:
        while True:
            await asyncio.sleep(5)
            await websocket.send_json(manager.getSocketData())
    except WebSocketDisconnect:
        await manager.disconnectMonitor(websocket)

@router.websocket("/{roomId}/{userId}")
async def websocketEndpoint(websocket: WebSocket, roomId: str, userId: str, session: SessionDep, background_tasks: BackgroundTasks):
    await manager.connect(roomId, userId,websocket)
    await manager.broadcast_to_room_lines(roomId)
    await manager.broadcastToMonitors()
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
                shape_data = data.copy()
                shape_data.pop("type", None)
                manager.addLine(roomId, shape_data)
            elif(data["type"] == "UNDO_LINE"):
                print(data)
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
        await manager.broadcastToMonitors()
        background_tasks.add_task(manager.checkRoom, roomId)