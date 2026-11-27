import { useState, Suspense } from "react";
import {
  Outlet,
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Box,
  Avatar,
  Typography,
  Button,
  IconButton,
  Drawer,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  LayoutDashboard,
  PackagePlus,
  History,
  Route,
  UserRound,
  House,
  LogOut,
  Menu as MenuIcon,
} from "lucide-react";
import Logo from "../components/common/Logo";
import NotificationBell from "../components/notifications/NotificationBell";
import Loading from "../components/common/Loading";
import { colors as c } from "../theme/palette";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { authApi } from "../services/api/authApi";
import { invalidateSessionRequests } from "../services/api/axiosInstance";
import { sessionCleared } from "../redux/slices/authSlice";
import { apiError } from "../services/helper/errors";
import { toast } from "sonner";
const links = [
  { to: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customer/book-shipment", label: "New shipment", icon: PackagePlus },
  { to: "/customer/orders", label: "Order history", icon: History },
  { to: "/customer/tracking", label: "Track shipment", icon: Route },
  { to: "/customer/profile", label: "My account", icon: UserRound },
];
export default function CustomerLayout() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loc = useLocation();
  const [mobile, setMobile] = useState(false),
    [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    try {
      await authApi.logout();
      invalidateSessionRequests();
      dispatch(sessionCleared());
      navigate("/");
      toast.success("Signed out successfully.");
    } catch (e) {
      toast.error(apiError(e).message);
    } finally {
      setBusy(false);
    }
  };
  const side = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        px: 2,
        py: 3,
        gap: 1.2,
        bgcolor: c.ink,
        color: c.ivory,
      }}
    >
      <Box
        component={Link}
        to="/"
        sx={{ color: "inherit", textDecoration: "none", mb: 3, px: 1 }}
      >
        <Logo />
      </Box>
      <Typography
        variant="overline"
        sx={{ color: c.sand, letterSpacing: 1.5, px: 1 }}
      >
        Customer workspace
      </Typography>
      {links.map((x) => (
        <Button
          key={x.to}
          component={NavLink}
          to={x.to}
          end
          startIcon={<x.icon size={19} />}
          onClick={() => setMobile(false)}
          sx={{
            color: c.ivory,
            justifyContent: "flex-start",
            textTransform: "none",
            borderRadius: 1.6,
            px: 1.5,
            py: 1.3,
            "&.active": { bgcolor: c.soft, color: c.ink, fontWeight: 800 },
            "&:hover": { bgcolor: "#ffffff15" },
          }}
        >
          {x.label}
        </Button>
      ))}
      <Box sx={{ flex: 1 }} />
      <Divider sx={{ borderColor: "#ffffff22" }} />
      <Button
        component={Link}
        to="/"
        startIcon={<House size={18} />}
        sx={{ color: c.ivory, justifyContent: "flex-start" }}
      >
        Back to home
      </Button>
      <Button
        onClick={logout}
        disabled={busy}
        startIcon={<LogOut size={18} />}
        sx={{ color: c.soft, justifyContent: "flex-start" }}
      >
        Sign out
      </Button>
    </Box>
  );
  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: c.ivory }}>
      <Box
        component="aside"
        sx={{
          width: 244,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: 0,
          height: "100dvh",
        }}
      >
        {side}
      </Box>
      <Drawer
        open={mobile}
        onClose={() => setMobile(false)}
        slotProps={{ paper: { sx: { width: 255 } } }}
      >
        {side}
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1050,
            bgcolor: c.paper,
            borderBottom: `1px solid ${c.line}`,
            minHeight: 70,
            px: { xs: 2, md: 4 },
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <IconButton
            aria-label="Open workspace menu"
            onClick={() => setMobile(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              FleetFlow Plus / Customer
            </Typography>
            <Typography fontWeight={800} noWrap>
              {links.find((x) => x.to === loc.pathname)?.label || "Workspace"}
            </Typography>
          </Box>
          {user && <NotificationBell key={user.id} />}
          <Tooltip title={user?.name || "Account"}>
            <Avatar
              src={user?.profileImage || undefined}
              sx={{ bgcolor: c.sand, color: c.ink, width: 36, height: 36 }}
            >
              {user?.name[0]}
            </Avatar>
          </Tooltip>
          <Box sx={{ display: { xs: "none", sm: "block" }, maxWidth: 160 }}>
            <Typography variant="caption" color="text.secondary">
              Welcome Customer
            </Typography>
            <Typography noWrap fontWeight={700} variant="body2">
              {user?.name}
            </Typography>
          </Box>
        </Box>
        <Box
          component="main"
          key={user?.id}
          sx={{ p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1550, mx: "auto" }}
        >
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
