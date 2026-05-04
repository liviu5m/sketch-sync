import { useState } from "react";
import BodyLayout from "../layouts/BodyLayout";
import { useAppContext } from "../../lib/AppProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../../api/user";
import { toast } from "react-toastify";

const Profile = () => {
  const { user } = useAppContext();
  const [username, setUsername] = useState(user?.username);
  const queryClient = useQueryClient();

  const { mutate: update, isPending } = useMutation({
    mutationKey: ["update-user"],
    mutationFn: () => updateUser(username || "", user?.id || -1),
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["jwt-user"] });
      setUsername("");
    },
    onError: (err) => {
      console.log(err);
      toast("Something went wrong.");
    },
  });

  return (
    <BodyLayout>
      <div className="flex items-center justify-center">
        <div className="container">
          <h2 className="font-bold text-3xl">Edit Profile</h2>
          <form
            className="w-1/3 mt-10"
            onSubmit={(e) => {
              e.preventDefault();
              update();
            }}
          >
            <div className="flex flex-col gap-4">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="bg-[#0F172A] border border-slate-700 outline-none focus:outline-none focus:ring-0 focus:border-[#f84a4a] hover:border-[#f84a4a] px-5 py-3 rounded-lg"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="bg-[#FF6B6B] text-white font-semibold py-2 rounded-2xl cursor-pointer hover:scale-105 hover:bg-[#f84a4a] w-full mt-5 flex items-center justify-center gap-3"
            >
              <span>Save</span>
              {isPending && (
                <div className="w-5 h-5 border-4 border-t-[#f84a4a] border-gray-300 rounded-full animate-spin"></div>
              )}
            </button>
          </form>
        </div>
      </div>
    </BodyLayout>
  );
};

export default Profile;
