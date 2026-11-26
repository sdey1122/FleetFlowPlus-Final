import { Navigate, Outlet } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import type { Role } from "../types/type/Role";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAuthModal } from "../hooks/useAuthModal";
import { dashboardPath } from "../constants/roles";
import Loading from "../components/common/Loading";
export default function RoleWrapper({ role }: { role: Role }) {
  const { user, status } = useAppSelector((s) => s.auth);
  const modal = useAuthModal();
  if (status === "loading") return <Loading />;
  if (!user)
    return (
      <Box sx={{ p: 5, textAlign: "center" }}>
        <Typography variant="h5" fontWeight={800}>
          {status === "unavailable"
            ? "Session service unavailable"
            : "Sign in to access your workspace"}
        </Typography>
        <Button
          variant="contained"
          onClick={() => modal.open("login")}
          sx={{ mt: 2 }}
        >
          Sign in
        </Button>
      </Box>
    );
  if (user.role !== role)
    return <Navigate to={dashboardPath(user.role)} replace />;
  return <Outlet />;
}
