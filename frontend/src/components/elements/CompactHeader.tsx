import { ArrowLeft, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

const CompactHeader = ({ code }: { code: string }) => {
  return (
    <header className="bg-[#0F172A] text-white flex items-center justify-between px-20 py-4 height-[50px]">
      <div className="flex items-center justify-center gap-10">
        <ArrowLeft className="text-[#eee]" />
        <Link to={"/"} className="flex items-center justify-center gap-5">
          <img src="./imgs/logo.png" className="w-8" alt="" />
          <h2 className="text-white text-xl font-semibold">SketchSync</h2>
        </Link>
        <div className="bg-[#1E293B] rounded-lg px-4 py-2 font-semibold text-sm flex items-center justify-center gap-3">
          <h3 className="text-slate-400">ROOM</h3>
          <h4>{code}</h4>
        </div>
      </div>
      <div className="bg-[#1E293B] rounded-lg px-4 py-2 font-semibold text-sm flex items-center justify-center gap-3">
        <Share2 />
        <span>Share</span>
      </div>
    </header>
  );
};

export default CompactHeader;
