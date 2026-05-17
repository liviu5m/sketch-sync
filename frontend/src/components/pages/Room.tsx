import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoomData } from "../../api/room";
import Loader from "../elements/Loader";
import { Stage, Layer, Line, Text, Rect, Circle } from "react-konva";
import Konva from "konva";
import CompactHeader from "../elements/CompactHeader";
import CanvaSidebar from "../elements/CanvaSidebar";
import { useAppContext } from "../../lib/AppProvider";
import { ArrowRight, ChevronRight, Users } from "lucide-react";
import type { User } from "../../lib/Types";
import { throttle } from "lodash";
import { RemoteCursor } from "../elements/RemoteCursor";

interface ShapeData {
  id: string;
  tool: "pen" | "eraser" | "rect" | "circle";
  points: number[];
  color: string;
  strokeWidth: number;
  userId: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
}

type UserCanva = User & {
  color: string;
  x: number;
  y: number;
};

export interface CursorPosition {
  x: number;
  y: number;
}

const Room = () => {
  const { user } = useAppContext();
  const location = useLocation();
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const [tool, setTool] = useState<"pen" | "eraser" | "rect" | "circle">("pen");
  const [lines, setLines] = useState<ShapeData[]>([]);
  const [redoStack, setRedoStack] = useState<ShapeData[]>([]);
  const [color, setColor] = useState("#1A1A1B");
  const [brushSize, setBrushSize] = useState(2);
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOpenedConnectedUsers, setIsOpenedConnectedUsers] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<UserCanva[]>([]);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const generateShapeId = () => {
    return `${Date.now()}-${Math.random()}-${user?.id}`;
  };

  useEffect(() => {
    if (!code || !user?.id) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/${code}/${user.id}`);

    ws.onopen = () => {
      console.log("✅ Connection Established");
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "ping" }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type == "USER_CONNECTION") setConnectedUsers(message.users);
      else if (message.type == "USER_COORDS") {
        setConnectedUsers((prevConnectedUsers: UserCanva[]) => {
          return prevConnectedUsers.map((user) => {
            if (user.id == message.data.userId)
              return { ...user, x: message.data.x, y: message.data.y };
            return user;
          });
        });
      } else if (message.type == "ADD_LINE" && message.data.userId != user.id) {
        setLines((prevLines: ShapeData[]) => {
          const index = prevLines.findIndex(
            (line) => line.id == message.data.id,
          );
          if (index == -1) return [...prevLines, message.data];
          const updatedLines = [...prevLines];
          updatedLines[index] = message.data;
          return updatedLines;
        });
      } else if (message.type == "UNDO_LINE" && message.data.userId != user.id)
        setLines((prevLines) => {
          if (message.data.id) {
            return prevLines.filter((line) => line.id !== message.data.id);
          }
          for (let i = prevLines.length - 1; i >= 0; i--) {
            if (prevLines[i].userId === message.data.userId) {
              return prevLines.filter((_, idx) => idx !== i);
            }
          }
          return prevLines;
        });
      else if (message.type == "REDO_LINE" && message.data.userId != user.id)
        redo(true);
      else if (message.type == "CLEAR_LINES" && message.data.userId != user.id)
        clear(true);
      else if (message.type == "REFRESH_LINE") {
        console.log(message);
        setLines(message.lines);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket Error:", error);
    };

    ws.onclose = (e) => {
      console.log("🔌 Connection Closed:", e.code, e.reason);
      setIsConnected(false);
    };

    socketRef.current = ws;
    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [code, user?.id]);

  const sendMessage = (msg: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(msg);
    } else {
      console.warn("⚠️ Cannot send: Socket is", socketRef.current?.readyState);
    }
  };
  const isDrawing = useRef<boolean>(false);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();

    if (pos && user) {
      setRedoStack((prev) => prev.filter((el) => el.userId != user.id));
      const newShape = {
        id: generateShapeId(),
        tool,
        color,
        strokeWidth: brushSize,
        points: [pos.x, pos.y],
        userId: user.id,
      };
      setLines([...lines, newShape]);
      broadcastLinePosition(newShape);
    }
  };

  useEffect(() => {
    console.log(redoStack);
  }, [redoStack]);

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point || !stageContainerRef.current) return;
    const containerRect = stageContainerRef.current.getBoundingClientRect();
    console.log(user?.id);

    sendPosition({
      x: point.x + containerRect.left,
      y: point.y + containerRect.top,
    });
    if (!isDrawing.current) return;

    const userLines = lines.filter((el) => el.userId == user?.id);
    if (userLines.length == 0) return;
    const last = userLines[userLines.length - 1];

    if (last.tool === "pen" || last.tool === "eraser") {
      last.points = last.points.concat([point.x, point.y]);
    } else if (last.tool === "rect") {
      last.width = point.x - (last.points[0] || 0);
      last.height = point.y - (last.points[1] || 0);
    } else if (last.tool === "circle") {
      const dx = point.x - (last.points[0] || 0);
      const dy = point.y - (last.points[1] || 0);
      last.radius = Math.sqrt(dx * dx + dy * dy);
    }

    const newLines = lines.filter((el) => el.id != last.id);
    setLines([...newLines, last]);
    broadcastLinePosition({ ...last, x: point.x, y: point.y });
  };

  const sendPosition = throttle((coords: CursorPosition) => {
    sendMessage(
      JSON.stringify({ ...coords, userId: user?.id, type: "COORDS" }),
    );
  }, 100);

  const broadcastLinePosition = throttle((line: ShapeData) => {
    sendMessage(JSON.stringify({ ...line, userId: user?.id, type: "LINE" }));
  }, 100);

  const handleMouseUp = () => {
    isDrawing.current = false;
  };
  const undo = (repeat?: boolean) => {
    const userLines = lines.filter((line) => line.userId === user?.id);
    if (userLines.length === 0) return;

    const lastUserLine = userLines[userLines.length - 1];

    setLines((prev) => prev.filter((line) => line.id !== lastUserLine.id));

    setRedoStack((prevStack) => [...prevStack, lastUserLine]);

    if (!repeat) {
      sendMessage(
        JSON.stringify({
          type: "UNDO_LINE",
          userId: user?.id,
          id: lastUserLine.id,
        }),
      );
    }
  };

  const redo = (repeat?: boolean) => {
    const userRedoLines = redoStack.filter((line) => line.userId === user?.id);
    if (userRedoLines.length === 0) return;

    const lineToRestore = userRedoLines[userRedoLines.length - 1];

    setLines((prevLines) => [...prevLines, lineToRestore]);

    broadcastLinePosition(lineToRestore);

    setRedoStack((prevStack) =>
      prevStack.filter((line) => line.id !== lineToRestore.id),
    );

    if (!repeat) {
      sendMessage(JSON.stringify({ type: "REDO_LINE", userId: user?.id }));
    }
  };

  const clear = (repeat?: boolean) => {
    setLines([]);
    if (!repeat)
      sendMessage(JSON.stringify({ type: "CLEAR_LINES", userId: user?.id }));
  };

  const {
    data: roomData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["get-room-data"],
    queryFn: () => getRoomData(code),
    retry: false,
    enabled: !!code,
  });

  useEffect(() => {
    if (isError)
      navigate("/", {
        state: {
          message: "Room not found",
        },
      });
  }, [isError]);

  useEffect(() => {
    if (location.state.verification && location.state.code) {
      setCode(location.state.code);
    } else navigate("/", { replace: true });
  }, [roomData]);

  return isPending ? (
    <Loader />
  ) : (
    <main className="h-screen overflow-hidden">
      <CompactHeader code={code} />
      {connectedUsers.map((u, i: number) => {
        if (u.id != user?.id)
          return (
            <div key={i}>
              <RemoteCursor x={u.x} y={u.y} color={u.color} name={u.username} />
            </div>
          );
      })}
      <div className="flex justify-between">
        <div className="absolute top-24 right-5 z-10 select-none">
          <div
            className={`flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm cursor-pointer transition-all duration-200 hover:bg-slate-50 active:scale-95 ${
              isOpenedConnectedUsers
                ? "ring-2 ring-blue-500/10 border-blue-400"
                : ""
            }`}
            onClick={() => setIsOpenedConnectedUsers(!isOpenedConnectedUsers)}
          >
            <div className="flex items-center gap-2 text-slate-700">
              <Users size={18} strokeWidth={2.5} />
              <span className="font-bold text-sm">{connectedUsers.length}</span>
            </div>

            <div
              className={`text-slate-400 transition-transform duration-300 ${isOpenedConnectedUsers ? "rotate-90" : ""}`}
            >
              <ChevronRight size={16} />
            </div>
          </div>

          {isOpenedConnectedUsers && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-50/80 border-b border-slate-100 px-5 py-3">
                <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  Online now
                </h2>
              </div>

              <div className="p-2">
                {connectedUsers.map((user, i: number) => {
                  return (
                    <div key={i} className="flex items-center mb-2">
                      <div
                        className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold`}
                        style={{ backgroundColor: user.color }}
                      >
                        {user.username[0]}
                      </div>
                      <p className="p-3 text-sm text-slate-600 font-bold">
                        {user.username}
                      </p>
                    </div>
                  );
                })}
                {connectedUsers.length == 0 && (
                  <div className="p-3 text-sm text-slate-400 text-center">
                    No other users active
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <CanvaSidebar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          undo={undo}
          redo={redo}
          clear={clear}
        />
        <div ref={stageContainerRef}>
          <Stage
            className="cursor-crosshair"
            width={window.innerWidth - 100}
            height={window.innerHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseup={handleMouseUp}
          >
            <Layer>
              {lines.map((shape: ShapeData, i: number) => {
                if (shape.tool === "rect") {
                  return (
                    <Rect
                      key={i}
                      x={shape.points[0]}
                      y={shape.points[1]}
                      width={shape.width}
                      height={shape.height}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                    />
                  );
                } else if (shape.tool === "circle") {
                  return (
                    <Circle
                      key={i}
                      x={shape.points[0]}
                      y={shape.points[1]}
                      radius={shape.radius}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                    />
                  );
                } else {
                  return (
                    <Line
                      key={i}
                      points={shape.points}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation={
                        shape.tool === "eraser"
                          ? "destination-out"
                          : "source-over"
                      }
                    />
                  );
                }
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </main>
  );
};

export default Room;
