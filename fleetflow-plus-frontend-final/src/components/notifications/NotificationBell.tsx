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
  CircularProgress,
} from "@mui/material";
import {
  Bell,
  Package,
  CreditCard,
  CheckCheck,
  ShieldCheck,
  PartyPopper,
  Inbox,
  Mail,
} from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppSelector } from "../../hooks/useAppSelector";
import {
  useNotificationsQuery,
  useReadAllMutation,
  useReadOneMutation,
} from "../../services/api/notificationApi";
import { toast } from "sonner";
import type { IApiError } from "../../types/interface/IApiError";
import { colors as c } from "../../theme/palette";

export default function NotificationBell() {
  const user = useAppSelector((s) => s.auth.user);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const q = useNotificationsQuery(user?.id ?? skipToken, {
    pollingInterval: 60000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const [all, { isLoading: markingAll }] = useReadAllMutation();
  const [one, { isLoading: markingOne }] = useReadOneMutation();
  if (!user) return null;

  // currentData is scoped to this account, even when the query argument changes.
  const data = q.currentData;
  const items = data?.items ?? [];
  const unread = data?.unreadCount ?? 0;
  const error = q.error && "message" in q.error ? q.error : undefined;
  const message = (e: unknown) =>
    typeof (e as IApiError | null)?.message === "string"
      ? (e as IApiError).message
      : "Could not mark notifications read.";
  const markAll = async () => {
    try {
      await all(user.id).unwrap();
    } catch (e) {
      toast.error(message(e));
    }
  };
  const markOne = async (id: string) => {
    try {
      await one({ userId: user.id, id }).unwrap();
    } catch (e) {
      toast.error(message(e));
    }
  };
  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          onClick={(e) => {
            setAnchor(e.currentTarget);
            if (!q.isFetching && (q.isError || !data)) void q.refetch();
          }}
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
              {!data
                ? q.isFetching
                  ? "Loading updates…"
                  : "Account updates"
                : unread
                  ? `${unread} unread`
                  : "You’re all caught up"}
            </Typography>
          </Box>
          <Tooltip title="Mark all as read">
            <span>
              <IconButton
                aria-label="Mark all as read"
                disabled={!unread || markingAll || markingOne}
                onClick={markAll}
              >
                <CheckCheck size={21} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 390, overflowY: "auto" }}>
          {q.isError && (
            <Alert
              severity="warning"
              action={
                <Button
                  disabled={q.isFetching}
                  onClick={() => void q.refetch()}
                >
                  Retry
                </Button>
              }
            >
              {data
                ? "Could not refresh. Showing your last loaded updates."
                : "Could not load notifications."}
              <Typography variant="caption" component="div">
                {error?.message || "Please try again."}
                {error && "code" in error && error.code
                  ? ` (${error.code})`
                  : ""}
              </Typography>
            </Alert>
          )}
          {!data && q.isFetching && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {data && !items.length && (
            <Box sx={{ p: 4, textAlign: "center", color: c.muted }}>
              <Inbox size={30} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                No notifications yet.
              </Typography>
            </Box>
          )}
          {items.map((n) => {
            const Icon =
              n.kind === "welcome"
                ? PartyPopper
                : n.kind === "contact"
                  ? Mail
                  : n.kind === "order" ? Package : n.kind === "payment" ? CreditCard : ShieldCheck;
            return (
              <Box
                component="button"
                type="button"
                key={n.id}
                disabled={markingAll || markingOne}
                onClick={() => {
                  if (!n.readAt) void markOne(n.id);
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
