import { lazy, Suspense, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/footer/Footer";
import Loading from "../components/common/Loading";
import { useAuthModal } from "../hooks/useAuthModal";
import { useAppSelector } from "../hooks/useAppSelector";
import { useSessionBootstrap } from "../hooks/useSessionBootstrap";
import { useSocket } from "../hooks/useSocket";
const AuthModal = lazy(() => import("../components/auth/AuthModal"));
export default function MainLayout() {
  useSessionBootstrap();
  useSocket();
  const loc = useLocation(),
    navigate = useNavigate();
  const { open } = useAuthModal();
  const active = useAppSelector((s) => s.modal.active);
  const pending = useAppSelector((s) => s.modal.pending);
  const user = useAppSelector((s) => s.auth.user);
  useEffect(() => {
    if (loc.hash === "#verify-email" || loc.hash === "#reset-password") {
      open(loc.hash === "#verify-email" ? "verify" : "reset");
      navigate(loc.pathname, { replace: true });
      return;
    }
    if (loc.pathname === "/" && loc.hash) {
      const id = loc.hash.slice(1);
      let tries = 0;
      const t = setInterval(() => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
          clearInterval(t);
        } else if (++tries > 30) clearInterval(t);
      }, 100);
      return () => clearInterval(t);
    }
    window.scrollTo(0, 0);
  }, [loc.pathname, loc.hash]);
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      {!user && pending && (
        <Box
          sx={{
            bgcolor: "background.paper",
            px: 2,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            flexWrap: "wrap",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption">
            Your email verification is pending.
          </Typography>
          <Button
            size="small"
            onClick={() => open("verify")}
            sx={{ minHeight: 28, color: "error.main" }}
          >
            Continue verification
          </Button>
        </Box>
      )}
      <Box component="main" sx={{ flex: 1 }}>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </Box>
      <Footer />
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
    </Box>
  );
}
