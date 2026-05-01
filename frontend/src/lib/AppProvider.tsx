"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "./Types";
import { ToastContainer } from "react-toastify";

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // const { data, isPending } = useQuery({
  //   queryKey: ["jwt-user"],
  //   queryFn: () => getUser(),
  // });

  // useEffect(() => {
  //   if (typeof data === "object") setUser(data);
  // }, [data]);
  
  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
      }}
    >
      {children}
      <ToastContainer />
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};