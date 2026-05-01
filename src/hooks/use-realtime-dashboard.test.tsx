import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRealtimeDashboard } from "@/hooks/use-realtime-dashboard";
import { queryClient } from "@/lib/query-client";

const authState = vi.hoisted(() => ({
  token: "jwt-token",
  isAuthenticated: true,
}));

const socketState = vi.hoisted(() => ({
  handlers: {} as Record<string, () => void>,
  disconnect: vi.fn(),
  io: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authState,
}));

vi.mock("socket.io-client", () => ({
  io: socketState.io,
}));

function DashboardRealtimeProbe() {
  useRealtimeDashboard();
  return <div>dashboard realtime probe</div>;
}

describe("useRealtimeDashboard", () => {
  beforeEach(() => {
    socketState.handlers = {};
    socketState.disconnect.mockReset();
    socketState.io.mockReset();
    socketState.io.mockReturnValue({
      on: vi.fn((event: string, handler: () => void) => {
        socketState.handlers[event] = handler;
      }),
      disconnect: socketState.disconnect,
    });
    authState.token = "jwt-token";
    authState.isAuthenticated = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  it("invalidates dashboard query groups when WebSocket update events arrive", () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();

    render(<DashboardRealtimeProbe />);

    expect(socketState.io).toHaveBeenCalledWith("/", {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token: "jwt-token" },
    });

    socketState.handlers["metrics:update"]();
    socketState.handlers["pipeline:update"]();
    socketState.handlers["alert:update"]();
    socketState.handlers["system:maintenance"]();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["metrics"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["pipelines"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["alerts"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["containers"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["settings"] });
  });

  it("does not connect sockets until the user is authenticated", () => {
    authState.token = null as unknown as string;
    authState.isAuthenticated = false;

    render(<DashboardRealtimeProbe />);

    expect(socketState.io).not.toHaveBeenCalled();
  });

  it("disconnects the dashboard socket on teardown", () => {
    const { unmount } = render(<DashboardRealtimeProbe />);

    unmount();

    expect(socketState.disconnect).toHaveBeenCalled();
  });
});
