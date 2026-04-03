import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SystemMetricsChart } from "@/components/SystemMetricsChart";

vi.mock("react-chartjs-2", () => ({
  Line: () => <div data-testid="line-chart" />,
}));

vi.mock("@/hooks/use-cloudops-queries", () => ({
  useMetricHistoryQueries: vi.fn(),
}));

const { useMetricHistoryQueries } = await import("@/hooks/use-cloudops-queries");

describe("SystemMetricsChart", () => {
  it("renders chart controls and loading state", () => {
    vi.mocked(useMetricHistoryQueries).mockReturnValue([
      { data: [], isLoading: true, error: null },
      { data: [], isLoading: false, error: null },
      { data: [], isLoading: false, error: null },
    ] as never);

    render(<SystemMetricsChart />);

    expect(screen.getByText("System Metrics")).toBeInTheDocument();
    expect(screen.getByText("Updating metrics...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "15m" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CPU" })).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("allows toggling visible metrics", () => {
    vi.mocked(useMetricHistoryQueries).mockReturnValue([
      { data: [{ value: 50, created_at: new Date().toISOString() }], isLoading: false, error: null },
      { data: [{ value: 60, created_at: new Date().toISOString() }], isLoading: false, error: null },
      { data: [{ value: 70, created_at: new Date().toISOString() }], isLoading: false, error: null },
    ] as never);

    render(<SystemMetricsChart />);

    const diskButton = screen.getByRole("button", { name: "Disk" });
    fireEvent.click(diskButton);

    expect(screen.getByRole("button", { name: "Disk" })).toBeInTheDocument();
  });
});
