import React from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../lib/AppProvider";

interface NonAuthRequiredRouteProps {
  children: ReactNode;
}

const NonAuthRequiredRoute: React.FC<NonAuthRequiredRouteProps> = ({
  children,
}) => {
  const { user } = useAppContext();
  const location = useLocation();

  if (user) {
    return (
      <Navigate to="/" state={{ from: location.pathname }} replace={true} />
    );
  }

  return <>{children}</>;
};

export default NonAuthRequiredRoute;
