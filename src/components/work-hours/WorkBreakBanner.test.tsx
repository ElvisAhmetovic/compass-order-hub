import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkBreakBanner, { formatCountdown, getActiveWorkBreak } from "./WorkBreakBanner";

let mockRole: "admin" | "agent" | "user" | "client" | null = "admin";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockRole
      ? { id: "qa-user", email: "qa@example.com", full_name: "QA User", role: mockRole }
      : null,
  }),
}));

const sarajevoDate = (iso: string) => new Date(iso);

describe("work-break schedule", () => {
  it.each([
    ["2026-09-21T09:59:59Z", null],
    ["2026-09-21T10:00:00Z", "lunch"],
    ["2026-09-21T10:59:59Z", "lunch"],
    ["2026-09-21T11:00:00Z", null],
    ["2026-09-21T12:59:59Z", null],
    ["2026-09-21T13:00:00Z", "afternoon"],
    ["2026-09-21T13:29:59Z", "afternoon"],
    ["2026-09-21T13:30:00Z", null],
  ])("uses exact summer boundaries for %s", (iso, expected) => {
    expect(getActiveWorkBreak(sarajevoDate(iso))?.key ?? null).toBe(expected);
  });

  it.each([
    ["2026-01-19T10:59:59Z", null],
    ["2026-01-19T11:00:00Z", "lunch"],
    ["2026-01-19T13:59:59Z", null],
    ["2026-01-19T14:00:00Z", "afternoon"],
  ])("handles Sarajevo winter time for %s", (iso, expected) => {
    expect(getActiveWorkBreak(sarajevoDate(iso))?.key ?? null).toBe(expected);
  });

  it.each(["2026-09-19T10:30:00Z", "2026-09-20T10:30:00Z"])(
    "does not schedule weekend breaks for %s",
    (iso) => expect(getActiveWorkBreak(sarajevoDate(iso))).toBeNull(),
  );

  it("formats and clamps countdown values", () => {
    expect(formatCountdown(3600)).toBe("60:00");
    expect(formatCountdown(1799)).toBe("29:59");
    expect(formatCountdown(-1)).toBe("00:00");
  });
});

describe("WorkBreakBanner roles", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T10:15:00Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    mockRole = "admin";
  });

  it.each(["admin", "agent", "user"] as const)("shows for %s staff", (role) => {
    mockRole = role;
    render(<WorkBreakBanner />);
    expect(screen.getByText("Work Break 1h")).toBeInTheDocument();
    expect(screen.getByText("45:00")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Work Break 1h has started.");
  });

  it("stays hidden for clients", () => {
    mockRole = "client";
    render(<WorkBreakBanner />);
    expect(screen.queryByText("Work Break 1h")).not.toBeInTheDocument();
  });

  it("cleans up its one-second timer", () => {
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");
    const { unmount } = render(<WorkBreakBanner />);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});