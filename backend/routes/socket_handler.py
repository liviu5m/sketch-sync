from fastapi import WebSocket, APIRouter
from starlette.websockets import WebSocketDisconnect

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

    async def broadcast_to_room(self, roomId: str, message: str):
        if roomId in self.rooms:
            for connection in self.rooms[roomId].values():
                await connection.send_text(message)

    def print_rooms(self):
        print(self.rooms)

manager = ConnectionManager()

@router.websocket("/{roomId}/{userId}")
async def websocketEndpoint(websocket: WebSocket, roomId: str, userId: str):
    await manager.connect(roomId, userId,websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(data)
    except WebSocketDisconnect:
        manager.disconnect(roomId, userId)

def printUsers():
    manager.print_rooms()