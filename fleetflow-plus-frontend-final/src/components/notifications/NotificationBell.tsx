import { useState } from "react";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Button,
  Divider,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  PartyPopper,
  Inbox,
  Mail,
} from "lucide-react";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import {
  useNotificationsQuery,
  useReadAllMutation,
  useReadOneMutation,
} from "../../services/api/notificationApi";
import { readGuest } from "../../redux/slices/notificationSlice";
import { toast } from "sonner";
import { colors as c } from "../../theme/palette";
export default function NotificationBell() {
  const user = useAppSelector((s) => s.auth.user);
  const guest = useAppSelector((s) => s.notifications.guest);
  const dispatch = useAppDispatch();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const q = useNotificationsQuery(user?.id || "", {
    skip: !user,
    pollingInterval: 45000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [all, { isLoading }] = useReadAllMutation();
  const [one] = useReadOneMutation();
  const items = user ? q.currentData?.items || [] : guest;
  const unread = user
    ? q.currentData?.unreadCount || 0
    : guest.filter((n) => !n.readAt).length;
  const markAll = async () => {
    try {
      if (user) await all().unwrap();
      else dispatch(readGuest());
    } catch {
      toast.error("Unable to mark notifications read.");
    }
  };
  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            position: "relative",
            border: 0,
            flexShrink: 0,
            "&:hover": {
              boxShadow: `0 0 0 2px ${c.soft}`,
              bgcolor: "transparent",
            },
          }}
        >
          <Bell size={21} />
          {unread > 0 && (
            <Box
              sx={{
                position: "absolute",
                right: 8,
                top: 7,
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: c.coral,
                border: "1px solid",
                borderColor: c.paper,
              }}
            />
          )}
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 365,
              maxWidth: "calc(100vw - 20px)",
              mt: 1,
              boxShadow: "0 16px 50px #28282522",
              border: `1px solid ${c.line}`,
            },
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box>
            <Typography fontWeight={800}>Notifications</Typography>
            <Typography variant="caption" color="text.secondary">
              {unread ? `${unread} unread` : "You’re all caught up"}
            </Typography>
          </Box>
          <Tooltip title="Mark all as read">
            <span>
              <IconButton
                aria-label="Mark all as read"
                disabled={!unread || isLoading}
                onClick={markAll}
              >
                <CheckCheck size={21} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 390, overflowY: "auto" }}>
          {user && q.isError && (
            <Alert
              severity="warning"
              action={<Button onClick={() => q.refetch()}>Retry</Button>}
            >
              Notifications unavailable.
            </Alert>
          )}
          {!items.length && !q.isError && (
            <Box sx={{ p: 4, textAlign: "center", color: c.muted }}>
              <Inbox size={30} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {user
                  ? q.isLoading
                    ? "Loading…"
                    : "No notifications yet."
                  : "Updates about your account will appear here."}
              </Typography>
            </Box>
          )}
          {items.map((n) => {
            const Icon =
              n.kind === "welcome"
                ? PartyPopper
                : n.kind === "contact"
                  ? Mail
                  : ShieldCheck;
            return (
              <Box
                component="button"
                key={n.id}
                onClick={async () => {
                  if (n.readAt) return;
                  try {
                    if (user) await one(n.id).unwrap();
                    else dispatch(readGuest());
                  } catch {
                    toast.error("Unable to mark notification read.");
                  }
                }}
                sx={{
                  width: "100%",
                  border: 0,
                  borderBottom: `1px solid ${c.line}`,
                  bgcolor: n.readAt ? c.paper : c.ivory,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  p: 2,
                  textAlign: "left",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#eee9df" },
                }}
              >
                <Box
                  sx={{
                    bgcolor: c.sand,
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                  }}
                >
                  <Icon size={19} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={750} variant="body2">
                    {n.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ overflowWrap: "anywhere" }}
                  >
                    {n.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(n.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                {!n.readAt && (
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      bgcolor: c.coral,
                      borderRadius: "50%",
                      mt: 1,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}
