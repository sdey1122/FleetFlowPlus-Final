import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAppSelector } from "./useAppSelector";
import { useAppDispatch } from "./useAppDispatch";
import { notificationApi } from "../services/api/notificationApi";

export const useSocket = () => {
  const token = useAppSelector((s) => s.auth.accessToken);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!token || !userId) return;
    const socket = io(
      import.meta.env.VITE_SOCKET_URL ||
        (import.meta.env.DEV
          ? "http://localhost:6050"
          : "https://fleetflowplus-final.onrender.com"),
      {
        path: import.meta.env.VITE_SOCKET_PATH || "/socket.io",
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
      },
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(
        () =>
          dispatch(
            notificationApi.util.invalidateTags([
              { type: "Notifications", id: userId },
            ]),
          ),
        250,
      );
    };
    socket.on("connect", refresh);
    socket.on("notifications:changed", refresh);
    return () => {
      if (timer) clearTimeout(timer);
      socket.off("connect", refresh);
      socket.off("notifications:changed", refresh);
      socket.disconnect();
    };
  }, [token, userId, dispatch]);
};
