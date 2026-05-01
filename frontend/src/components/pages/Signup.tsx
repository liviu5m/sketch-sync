import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { signupUser } from "../../api/user";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

const Signup = () => {
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const navigate = useNavigate();

  const { mutate: signup, isPending } = useMutation({
    mutationKey: ["signup-user"],
    mutationFn: () => signupUser(data),
    onSuccess: (data) => {
      console.log(data);
      navigate("/auth/login");
    },
    onError: (err: AxiosError) => {
      const response = err.response?.data as any;

      if (response?.detail && Array.isArray(response.detail)) {
        const firstError = response.detail[0];
        const errorMessage = firstError?.msg || "Validation error";
        toast.error(errorMessage);
      }
      else if (response?.detail && typeof response.detail === "string") {
        toast.error(response.detail);
      }
      else {
        toast.error("An error occurred");
      }
    },
  });

  return (
    <div className="bg-[#0F172A] text-white min-h-screen gradient-bg h-full flex items-center justify-center">
      <Link
        to={"/"}
        className="flex items-center justify-center gap-5 absolute top-5 left-5 cursor-pointer p-2"
      >
        <ArrowLeft className="w-5 text-slate-400" />
        <span className="text-slate-400">Back</span>
      </Link>
      <div className="border border-slate-700 bg-[#162033] rounded-2xl p-10 w-[500px] flex items-center justify-center flex-col gap-6 shadow">
        <h1 className="text-2xl font-semibold">Sign Up</h1>
        <p className="text-slate-400">
          Welcome back! Please sign up to continue
        </p>
        <form
          className="flex flex-col gap-4 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            signup();
          }}
        >
          <input
            type="text"
            placeholder="Username"
            className="bg-[#0F172A] border border-slate-700 outline-none focus:outline-none focus:ring-0 focus:border-[#f84a4a] hover:border-[#f84a4a] px-5 py-3 rounded-lg"
            value={data.username}
            onChange={(e) => setData({ ...data, username: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="bg-[#0F172A] border border-slate-700 outline-none focus:outline-none focus:ring-0 focus:border-[#f84a4a] hover:border-[#f84a4a] px-5 py-3 rounded-lg"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="bg-[#0F172A] border border-slate-700 outline-none focus:outline-none focus:ring-0 focus:border-[#f84a4a] hover:border-[#f84a4a] px-5 py-3 rounded-lg"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password Confirmation"
            className="bg-[#0F172A] border border-slate-700 outline-none focus:outline-none focus:ring-0 focus:border-[#f84a4a] hover:border-[#f84a4a] px-5 py-3 rounded-lg"
            value={data.passwordConfirmation}
            onChange={(e) =>
              setData({ ...data, passwordConfirmation: e.target.value })
            }
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#FF6B6B] text-white font-semibold py-2 rounded-2xl cursor-pointer hover:scale-105 hover:bg-[#f84a4a] flex items-center justify-center gap-5"
          >
            {isPending && (
              <div className="w-5 h-5 border-4 border-t-slate-500 border-gray-300 rounded-full animate-spin"></div>
            )}
            Sign Up
          </button>
        </form>
        <div className="relative my-5 w-full">
          <div className="h-px w-full bg-slate-700"></div>
          <p className="text-slate-500 absolute top-1/2 left-1/2 -translate-1/2 px-5 bg-[#162033]">
            or
          </p>
        </div>
        <button className="w-full flex items-center justify-center gap-3 bg-[#1E293B] text-slate-300 font-semibold py-3 rounded-xl border border-slate-700 hover:bg-[#334155] hover:border-[#FF6B6B] hover:text-white transition-all duration-200 cursor-pointer hover:scale-105">
          <img src="/imgs/google.png" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>
        <p className="text-slate-400">
          Already have an account ?{" "}
          <Link className="text-slate-300 font-semibold" to="/auth/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
