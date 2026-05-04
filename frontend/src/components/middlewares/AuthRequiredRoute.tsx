import React from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../lib/AppProvider";

interface AuthRequiredRouteProps {
  children: ReactNode;
}

const AuthRequiredRoute: React.FC<AuthRequiredRouteProps> = ({
  children,
}) => {
  const { user } = useAppContext();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate to="/auth/login" state={{ from: location.pathname }} replace={true} />
    );
  }

  return <>{children}</>;
};

export default AuthRequiredRoute;
