import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { useSessionBootstrap } from "../hooks/useSessionBootstrap";
import { useSocket } from "../hooks/useSocket";
import { useAppSelector } from "../hooks/useAppSelector";
import Loading from "../components/common/Loading";
const AuthModal = lazy(() => import("../components/auth/AuthModal"));
export default function AppRuntime() {
  useSessionBootstrap();
  useSocket();
  const active = useAppSelector((s) => s.modal.active);
  return (
    <>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
      {active && (
        <Suspense
          fallback={
            <Box
              role="status"
              sx={{
                position: "fixed",
                inset: 0,
                zIndex: 1400,
                bgcolor: "#28282555",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Loading />
            </Box>
          }
        >
          <AuthModal />
        </Suspense>
      )}
    </>
  );
}
