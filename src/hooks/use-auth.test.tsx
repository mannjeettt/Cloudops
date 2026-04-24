import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { setAuthToken } from "@/lib/auth-token";
import { queryClient } from "@/lib/query-client";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function AuthProbe() {
  const { isAuthenticated, isBootstrapping, login, token, user } = useAuth();

  return (
    <div>
      <div data-testid="bootstrapping">{String(isBootstrapping)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="email">{user?.email ?? "none"}</div>
      <div data-testid="token">{token ?? "none"}</div>
      <button type="button" onClick={() => void login("admin@cloudops.io", "password123")}>
        login
      </button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    setAuthToken(null);
    queryClient.clear();
  });

  it("logs in with the backend token and stores the session", async () => {
    const fetchMock = vi.spyOn(window, "fetch").mockResolvedValueOnce(jsonResponse({
        token: "jwt-token",
        user: { id: "1", email: "admin@cloudops.io", name: "Admin", role: "admin" },
      }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("bootstrapping")).toHaveTextContent("false"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "login" }));
    });

    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));

    expect(fetchMock).toHaveBeenLastCalledWith("/api/auth/login", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: "admin@cloudops.io", password: "password123" }),
    }));
    expect(screen.getByTestId("email")).toHaveTextContent("admin@cloudops.io");
    expect(screen.getByTestId("token")).toHaveTextContent("jwt-token");
    expect(window.localStorage.getItem("cloudops.auth.token")).toBe("jwt-token");
  });

  it("refreshes the session from a stored token", async () => {
    window.localStorage.setItem("cloudops.auth.token", "stored-token");
    const fetchMock = vi.spyOn(window, "fetch").mockResolvedValueOnce(jsonResponse({
      user: { id: "1", email: "admin@cloudops.io", name: "Admin", role: "admin" },
    }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", expect.objectContaining({
      headers: expect.any(Headers),
    }));
    const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer stored-token");
    expect(screen.getByTestId("email")).toHaveTextContent("admin@cloudops.io");
  });

  it("clears an invalid stored session during refresh", async () => {
    window.localStorage.setItem("cloudops.auth.token", "expired-token");
    vi.spyOn(window, "fetch").mockResolvedValueOnce(jsonResponse({ message: "Token expired" }, 401));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("bootstrapping")).toHaveTextContent("false"));

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(window.localStorage.getItem("cloudops.auth.token")).toBeNull();
  });
});
