import {
  Circle,
  Eraser,
  Pencil,
  Redo,
  Square,
  Trash,
  Type,
  Undo,
} from "lucide-react";
import React, { useState } from "react";

const CanvaSidebar = () => {
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#1A1A1B");
  const [brushSize, setBrushSize] = useState(2);

  const colors = [
    "#1A1A1B",
    "#2563EB",
    "#10B981",
    "#EF4444",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#94A3B8",
  ];

  return (
    <div className={`h-[calc(100vh-70px)] w-[100px] bg-[#0F172A] border border-slate-800 text-white p-3 flex flex-col justify-between`}>
      <div>
        <div className="flex flex-col items-center justify-center gap-1 mt-5">
          <span
            className={`w-full py-3 rounded-md hover:text flex items-center justify-center cursor-pointer ${tool == "pen" ? "bg-[#FF6B6B]" : "bg-[#0F172A] text-slate-400 hover:text-white hover:bg-[#182135]"}`}
            onClick={() => setTool("pen")}
          >
            <Pencil className="w-5" />
          </span>
          <span
            className={`w-full py-3 rounded-md hover:text flex items-center justify-center cursor-pointer ${tool == "eraser" ? "bg-[#FF6B6B]" : "bg-[#0F172A] text-slate-400 hover:text-white hover:bg-[#182135]"}`}
            onClick={() => setTool("eraser")}
          >
            <Eraser />
          </span>
          <span
            className={`w-full py-3 rounded-md hover:text flex items-center justify-center cursor-pointer ${tool == "square" ? "bg-[#FF6B6B]" : "bg-[#0F172A] text-slate-400 hover:text-white hover:bg-[#182135]"}`}
            onClick={() => setTool("square")}
          >
            <Square />
          </span>
          <span
            className={`w-full py-3 rounded-md hover:text flex items-center justify-center cursor-pointer ${tool == "circle" ? "bg-[#FF6B6B]" : "bg-[#0F172A] text-slate-400 hover:text-white hover:bg-[#182135]"}`}
            onClick={() => setTool("circle")}
          >
            <Circle />
          </span>
          <span
            className={`w-full py-3 rounded-md hover:text flex items-center justify-center cursor-pointer ${tool == "text" ? "bg-[#FF6B6B]" : "bg-[#0F172A] text-slate-400 hover:text-white hover:bg-[#182135]"}`}
            onClick={() => setTool("text")}
          >
            <Type />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {colors.map((c: string) => {
            return (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                }}
                className={`w-5 h-5 rounded-full transition-transform hover:scale-105 active:scale-95 ${color == c ? "border-2 border-white" : ""}`}
                style={{ backgroundColor: c }}
              ></button>
            );
          })}
        </div>
        <div className="flex flex-col items-center justify-center p-4 h-64 w-full rounded-lg">
          <div className="flex items-center justify-center h-20 w-20">
            <div
              className="rounded-full bg-white shadow-sm border border-gray-200"
              style={{
                width: `${brushSize}px`,
                height: `${brushSize}px`,
              }}
            />
          </div>
          <div className="relative h-30 w-8 flex items-center justify-center">
            <input
              type="range"
              min="1"
              max="36"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="absolute w-30 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B6B] -rotate-90 outline-none border border-slate-500"
            />
          </div>
        </div>
      </div>
      <div>
        <span
          className={`w-full py-3 rounded-md hover:text flex items-center justify-center cursor-pointer "bg-[#0F172A] text-slate-400 hover:text-white hover:bg-[#182135]`}
          onClick={() => setTool("pen")}
        >
          <Undo className="w-5" />
        </span>
        <span
          className={`w-full py-3 rounded-md hover:text flex items-center justify-center cursor-pointer "bg-[#0F172A] text-slate-400 hover:text-white hover:bg-[#182135]`}
          onClick={() => setTool("pen")}
        >
          <Redo className="w-5" />
        </span>
        <span
          className={`w-full py-3 rounded-md hover:text flex items-center justify-center cursor-pointer "bg-[#0F172A] text-slate-400 hover:text-red-500 hover:bg-red-800/50`}
          onClick={() => setTool("pen")}
        >
          <Trash className="w-5" />
        </span>
      </div>
    </div>
  );
};

export default CanvaSidebar;
