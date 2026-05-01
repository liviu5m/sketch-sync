import React from "react";
import type { ReactNode } from "react";
import Header from "../elements/Header";

type LayoutProps = {
  children: ReactNode;
};

const BodyLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="bg-[#0F172A] text-white min-h-screen gradient-bg h-full">
      <Header />
      <main className="h-full">{children}</main>
    </div>
  );
};

export default BodyLayout;
