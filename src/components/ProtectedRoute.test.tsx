import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/components/ProtectedRoute";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("@/hooks/use-auth");

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to login", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/settings" element={<div>Settings page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("renders child routes for authenticated users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "1", email: "admin@cloudops.io", role: "admin", name: "Admin" },
      token: "token",
      isAuthenticated: true,
      isBootstrapping: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/settings" element={<div>Settings page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Settings page")).toBeInTheDocument();
  });
});
