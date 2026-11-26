import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../common/Logo";
import NotificationBell from "../notifications/NotificationBell";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAuthModal } from "../../hooks/useAuthModal";
import { roleLabels, dashboardPath } from "../../constants/roles";
import { authApi } from "../../services/api/authApi";
import { sessionCleared } from "../../redux/slices/authSlice";
import { invalidateSessionRequests } from "../../services/api/axiosInstance";
import { apiError } from "../../services/helper/errors";
import { colors as c } from "../../theme/palette";
import { toast } from "sonner";
export default function Navbar() {
  const { user, status } = useAppSelector((s) => s.auth);
  const pending = useAppSelector((s) => s.modal.pending);
  const modal = useAuthModal();
  const dispatch = useAppDispatch(),
    navigate = useNavigate(),
    loc = useLocation();
  const [mobile, setMobile] = useState<HTMLElement | null>(null),
    [account, setAccount] = useState<HTMLElement | null>(null),
    [busy, setBusy] = useState(false);
  const go = (id: string) => {
    setMobile(null);
    if (loc.pathname !== "/") navigate(`/#${id}`);
    else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      if (loc.hash !== `#${id}`) navigate(`/#${id}`, { replace: true });
    }
  };
  const logout = async () => {
    setBusy(true);
    try {
      await authApi.logout();
      invalidateSessionRequests();
      dispatch(sessionCleared());
      setAccount(null);
      navigate("/");
      toast.success("Signed out successfully.");
    } catch (e) {
      toast.error(apiError(e).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        top: 0,
        bgcolor: c.ivory,
        borderBottom: `1px solid ${c.line}`,
        zIndex: 1100,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          maxWidth: 1440,
          width: "100%",
          mx: "auto",
          px: { xs: 1, sm: 3, lg: 5 },
          minHeight: { xs: 62, sm: 74 },
          display: "flex",
          gap: { xs: 0.5, sm: 1.5 },
          "@media (min-width:768px)": { gap: 2 },
          flexWrap: "nowrap",
        }}
      >
        <Box
          component={Link}
          to="/"
          onClick={() => go("home")}
          sx={{
            textDecoration: "none",
            color: c.ink,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            "& svg": { width: { xs: 27, sm: 36 } },
          }}
        >
          <Logo />
        </Box>
        <Box
          sx={{
            flex: 1,
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          {["Home", "About", "Contact"].map((n) => (
            <Button
              key={n}
              onClick={() => go(n.toLowerCase())}
              sx={{
                color:
                  loc.hash === `#${n.toLowerCase()}` ||
                  (!loc.hash && n === "Home")
                    ? c.deep
                    : c.ink,
                fontSize: 14,
              }}
            >
              {n}
            </Button>
          ))}
        </Box>
        <Box sx={{ flex: { xs: 1, md: 0 } }} />
        <NotificationBell />
        {status === "loading" ? (
          <CircularProgress size={20} />
        ) : user ? (
          <>
            <Button
              aria-label="Account menu"
              onClick={(e) => setAccount(e.currentTarget)}
              sx={{ color: c.ink, p: 0.5, minWidth: 0, flexShrink: 0, gap: 1 }}
            >
              <Avatar
                src={user.profileImage || undefined}
                alt={user.name}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: c.sand,
                  color: c.ink,
                  fontSize: 15,
                }}
              >
                {user.name[0]?.toUpperCase()}
              </Avatar>
              <Box
                sx={{
                  display: { xs: "none", sm: "block" },
                  textAlign: "left",
                  maxWidth: { sm: 120, lg: 160 },
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", lineHeight: 1.3 }}
                >
                  Welcome {roleLabels[user.role]}
                </Typography>
                {user.role !== "admin" && (
                  <Typography noWrap fontWeight={750} variant="body2">
                    {user.name}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                <ChevronDown size={15} />
              </Box>
            </Button>
            <Menu
              anchorEl={account}
              open={!!account}
              onClose={() => setAccount(null)}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" fontWeight={700}>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {roleLabels[user.role]}
                </Typography>
              </Box>
              <Divider />
              <MenuItem
                onClick={() => {
                  setAccount(null);
                  navigate(dashboardPath(user.role));
                }}
              >
                <LayoutDashboard size={17} />
                <Box sx={{ ml: 1.3 }}>{roleLabels[user.role]} Dashboard</Box>
              </MenuItem>
              <MenuItem disabled={busy} onClick={logout}>
                <LogOut size={17} />
                <Box sx={{ ml: 1.3 }}>Logout</Box>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button
              onClick={() => modal.open("login")}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                color: c.ink,
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              Sign in
            </Button>
            <Button
              onClick={() => modal.open("register")}
              variant="contained"
              endIcon={<ArrowUpRight size={15} />}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                whiteSpace: "nowrap",
              }}
            >
              Sign up
            </Button>
          </>
        )}
        <IconButton
          aria-label="Navigation menu"
          onClick={(e) => setMobile(e.currentTarget)}
          sx={{ display: { xs: "inline-flex", md: "none" }, p: 0.8 }}
        >
          <MenuIcon size={23} />
        </IconButton>
        <Menu anchorEl={mobile} open={!!mobile} onClose={() => setMobile(null)}>
          {["Home", "About", "Contact"].map((n) => (
            <MenuItem key={n} onClick={() => go(n.toLowerCase())}>
              {n}
            </MenuItem>
          ))}
          {!user && (
            <>
              <Divider />
              <MenuItem
                onClick={() => {
                  setMobile(null);
                  modal.open("login");
                }}
              >
                Sign in
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMobile(null);
                  modal.open("register");
                }}
              >
                Sign up
              </MenuItem>
              {pending && (
                <MenuItem
                  onClick={() => {
                    setMobile(null);
                    modal.open("verify");
                  }}
                >
                  Continue verification
                </MenuItem>
              )}
            </>
          )}
        </Menu>
        {!user && pending && (
          <Button
            onClick={() => modal.open("verify")}
            sx={{
              display: { xs: "none", md: "inline-flex" },
              minWidth: 0,
              color: c.deep,
            }}
          >
            Verify email
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
