import { Link } from "react-router-dom";
import { useAppContext } from "../../lib/AppProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "../../api/user";

const Header = () => {
  const { user } = useAppContext();
  const queryClient = useQueryClient();
  const { mutate: logout } = useMutation({
    mutationKey: ["logout-user"],
    mutationFn: () => logoutUser(),
    onSuccess: (data) => {
      console.log(data);
      queryClient.setQueryData(["jwt-user"], null);
      queryClient.removeQueries({ queryKey: ["jwt-user"] });
    },
    onError: (err) => {
      console.log(err);
    },
  });

  return (
    <header className="flex items-center justify-center p-8">
      <div className="container flex items-center justify-between">
        <div className="flex items-center justify-center gap-5">
          <img src="./imgs/logo.png" className="w-8" alt="" />
          <h2 className="text-white text-xl font-semibold">SketchSync</h2>
        </div>
        {user ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="text-slate-300 rounded-xl border border-slate-700 bg-[#162033] px-6 py-3 cursor-pointer">
                  {user.username}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#162033] border-slate-700 text-slate-300 rounded-xl">
                <DropdownMenuGroup>
                  <DropdownMenuItem className="focus:bg-slate-700 focus:text-white cursor-pointer">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-slate-700 focus:text-white cursor-pointer"
                    onClick={() => logout()}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center justify-center gap-5 font-semibold text-sm">
            <Link
              to={"/auth/login"}
              className="text-slate-300 hover:text-white"
            >
              Log in
            </Link>
            <Link
              to={"/auth/signup"}
              className="text-[#0F172A] bg-white px-4 py-2 rounded-full hover:bg-gray-200"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
