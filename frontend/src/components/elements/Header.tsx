import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="flex items-center justify-center p-8">
      <div className="container flex items-center justify-between">
        <div className="flex items-center justify-center gap-5">
          <img src="./imgs/logo.png" className="w-8" alt="" />
          <h2 className="text-white text-xl font-semibold">SketchSync</h2>
        </div>
        <div className="flex items-center justify-center gap-5 font-semibold text-sm">
          <Link to={"/auth/login"} className="text-slate-300 hover:text-white">
            Log in
          </Link>
          <Link
            to={"/auth/signup"}
            className="text-[#0F172A] bg-white px-4 py-2 rounded-full hover:bg-gray-200"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
