import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import LaboDashboard from "./LaboDashboard";
import UserLaboDashboard from "./UserLaboDashboard";

export default function RoleDashboard(): ReactElement {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "labo") {
    return <LaboDashboard />;
  }
  return <UserLaboDashboard />;
}
