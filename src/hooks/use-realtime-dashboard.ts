import { useEffect } from "react";
import { io } from "socket.io-client";

import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/query-client";

const QUERY_KEYS = [
  ["alerts"],
  ["containers"],
  ["metrics"],
  ["pipelines"],
  ["settings"],
] as const;

export function useRealtimeDashboard() {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const socket = io("/", {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token },
    });

    const invalidateAll = () => {
      QUERY_KEYS.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: [...key] });
      });
    };

    socket.on("metrics:update", () => {
      void queryClient.invalidateQueries({ queryKey: ["metrics"] });
    });
    socket.on("pipeline:update", () => {
      void queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    });
    socket.on("alert:update", () => {
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    });
    socket.on("system:maintenance", invalidateAll);

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token]);
}
