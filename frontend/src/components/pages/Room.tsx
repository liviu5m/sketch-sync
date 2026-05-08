import React, { useEffect, useRef, useState } from "react";
import BodyLayout from "../layouts/BodyLayout";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoomData } from "../../api/room";
import Loader from "../elements/Loader";
import { Stage, Layer, Line, Text, Rect, Circle } from "react-konva";
import Konva from "konva";
import CompactHeader from "../elements/CompactHeader";
import CanvaSidebar from "../elements/CanvaSidebar";
import { useAppContext } from "../../lib/AppProvider";

interface ShapeData {
  tool: "pen" | "eraser" | "rect" | "circle";
  points: number[];
  color: string;
  strokeWidth: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
}

const Room = () => {
  const { user } = useAppContext();
  const location = useLocation();
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const [tool, setTool] = useState<"pen" | "eraser" | "rect" | "circle">("pen");
  const [lines, setLines] = useState<ShapeData[]>([]);
  const [linesHistory, setLinesHistory] = useState<ShapeData[]>([]);
  const [color, setColor] = useState("#1A1A1B");
  const [brushSize, setBrushSize] = useState(2);
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Guard: Don't attempt connection if IDs are missing
    if (!code || !user?.id) return;

    // Use localhost if 127.0.0.1 is giving you "Silent" failures
    const ws = new WebSocket(`ws://localhost:8000/ws/${code}/${user.id}`);

    ws.onopen = () => {
      console.log("✅ Connection Established");
      setIsConnected(true);
      // Optional: Send a heartbeat immediately to wake up the backend logs
      ws.send(JSON.stringify({ type: "ping" }));
    };

    ws.onmessage = (event) => {
      console.log("📩 Message from server:", event.data);
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket Error:", error);
    };

    ws.onclose = (e) => {
      console.log("🔌 Connection Closed:", e.code, e.reason);
      setIsConnected(false);
    };

    socketRef.current = ws;

    // CLEANUP: This is vital.
    // It prevents 100s of "Zombie" connections during development.
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

    if (pos) {
      setLines([
        ...lines,
        { tool, color, strokeWidth: brushSize, points: [pos.x, pos.y] },
      ]);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();

    if (!point) return;

    const last = { ...lines[lines.length - 1] };
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

    const newLines = lines.slice(0, -1);
    setLines([...newLines, last]);
    setLinesHistory(lines);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const undo = () => {
    setLines(lines.slice(0, -1));
  };

  const redo = () => {
    if (lines.length == linesHistory.length) return;
    setLines(linesHistory.slice(0, lines.length + 1));
  };

  const clear = () => setLines([]);

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
      <div className="flex justify-between">
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
        <Stage
          className="bg-red"
          width={window.innerWidth - 100}
          height={window.innerHeight}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
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
    </main>
  );
};

export default Room;
