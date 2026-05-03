import { useEffect, useState } from "react";
import BodyLayout from "../layouts/BodyLayout";
import { ActivityIcon, ArrowRight, UsersRound } from "lucide-react";
import axios from "axios";

const Home = () => {
  const [roomCode, setRoomCode] = useState("");

  return (
    <BodyLayout>
      <div className="flex items-center justify-center h-full">
        <div className="container flex justify-between items-center flex-col">
          <div className="mt-30 flex items-center justify-center flex-col">
            <h1 className="text-center text-[70px] font-extrabold">
              Welcome to <span className="text-hero-gradient">SketchSync</span>
            </h1>
            <p className="text-slate-400 text-lg mt-5 font-normal text-center">
              Real-time collaborative whiteboard for teams. Draw, plan, and
              create <br />
              together instantly with zero setup required.
            </p>
            <div className="border border-slate-700 bg-[#162033] rounded-2xl p-6 mt-14 w-[500px]">
              <button className="h-full bg-[#FF6B6B] text-white  font-semibold flex items-center justify-center gap-4 w-full rounded-2xl p-4 cursor-pointer hover:scale-105 hover:bg-[#f84a4a]">
                <span>Create New Room</span>
                <ArrowRight className="w-5" />
              </button>
              <div className="relative my-10">
                <div className="h-px w-full bg-slate-700"></div>
                <p className="text-slate-500 absolute top-1/2 left-1/2 -translate-1/2 px-5 bg-[#162033]">
                  or join with code
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  className="px-5 py-4 rounded-xl bg-[#0F172A] border border-slate-700 outline-none focus:outline-none focus:ring-0 focus:border-[#f84a4a] hover:border-[#f84a4a] w-full"
                  placeholder="E. G. ROOM-123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
                <button
                  className={`${roomCode != "" ? "text-white bg-slate-600 cursor-pointer hover:bg-slate-500" : "bg-slate-700 text-slate-400"} px-5 py-4 rounded-2xl font-semibold`}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
          <div className="mt-20 flex items-center justify-center gap-12">
            <div className="flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-[#162033] px-5 py-2">
              <ActivityIcon className="text-[#42C174] w-5" />
              <h3 className="text-slate-400">
                Active Rooms:{" "}
                <span className="text-white font-semibold">123</span>
              </h3>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-[#162033] px-5 py-2">
              <UsersRound className="text-[#60A5FA] w-5" />
              <h3 className="text-slate-400">
                Users Rooms:{" "}
                <span className="text-white font-semibold">324</span>
              </h3>
            </div>
          </div>
        </div>
      </div>
    </BodyLayout>
  );
};

export default Home;
