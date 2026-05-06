import React, { useEffect, useRef, useState } from "react";
import BodyLayout from "../layouts/BodyLayout";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoomData } from "../../api/room";
import Loader from "../elements/Loader";
import { Stage, Layer, Line, Text } from "react-konva";
import Konva from "konva";
import CompactHeader from "../elements/CompactHeader";
import CanvaSidebar from "../elements/CanvaSidebar";

interface LineData {
  tool: "pen" | "eraser";
  points: number[];
  color: string;
  strokeWidth: number;
}

const Room = () => {
  const location = useLocation();
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [lines, setLines] = useState<LineData[]>([]);
  const [color, setColor] = useState<string>("#000000");
  const [brushSize, setBrushSize] = useState<number>(5);

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

    const lastLine = { ...lines[lines.length - 1] };
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    const newLines = lines.slice(0, -1);
    setLines([...newLines, lastLine]);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const undo = () => {
    setLines(lines.slice(0, -1));
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

  console.log(roomData);

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
        <CanvaSidebar />
        <Stage
          className="bg-red"
          width={window.innerWidth - 100}
          height={window.innerHeight}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
        >
          <Layer>
            {lines.map((line: LineData, i: number) => (
              <Line
                key={i}
                points={line.points}
                stroke="#df4b26"
                strokeWidth={5}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === "eraser" ? "destination-out" : "source-over"
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </main>
  );
};

export default Room;
