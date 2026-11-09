import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

let mockRole: string = "admin";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", email: "tester@example.com", role: mockRole } }),
}));
vi.mock("@/hooks/useSidebarConfig", () => ({
  useSidebarConfig: () => ({ isHidden: () => false }),
}));
vi.mock("@/services/workHoursV2Service", () => ({
  isSuperAdminEmail: () => false,
  fetchLateCountToday: () => Promise.resolve(0),
}));
vi.mock("@/integrations/supabase/client", () => {
  const result = { data: [], count: 0, error: null };
  const chain: unknown = new Proxy(function () {}, {
    get: (_t, prop) =>
      prop === "then"
        ? (r: (v: typeof result) => unknown) => Promise.resolve(r(result))
        : () => chain,
    apply: () => chain,
  });
  return {
    supabase: {
      from: () => chain,
      channel: () => chain,
      removeChannel: () => {},
    },
  };
});

import Sidebar from "../Sidebar";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>,
  );

describe("Sidebar AI group", () => {
  beforeEach(() => { mockRole = "admin"; });

  it("shows an AI menu that is closed on the dashboard and opens on click", () => {
    renderAt("/dashboard");
    const group = screen.getByTestId("sidebar-ai-group");
    expect(within(group).getByRole("button", { name: /^AI$/ })).toBeInTheDocument();
    expect(within(group).queryByText("AI Outreach")).toBeNull();
    fireEvent.click(within(group).getByRole("button", { name: /^AI$/ }));
    expect(within(group).getByRole("link", { name: "AI Outreach" })).toHaveAttribute("href", "/ai-outreach");
    expect(within(group).getByRole("link", { name: "Services Knowledge" })).toHaveAttribute("href", "/services-knowledge");
  });

  it("no longer lists AI Outreach or Services Knowledge as top-level items", () => {
    renderAt("/dashboard");
    const group = screen.getByTestId("sidebar-ai-group");
    fireEvent.click(within(group).getByRole("button", { name: /^AI$/ }));
    expect(screen.getAllByText("AI Outreach")).toHaveLength(1);
    expect(screen.getAllByText("Services Knowledge")).toHaveLength(1);
  });

  it("sits right after Monthly Packages, near the top", () => {
    renderAt("/dashboard");
    const group = screen.getByTestId("sidebar-ai-group");
    const monthly = screen.getByRole("link", { name: /Monthly Packages/ });
    expect(monthly.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(monthly.nextElementSibling).toBe(group);
  });

  it("opens automatically on the AI Outreach page", () => {
    renderAt("/ai-outreach");
    const group = screen.getByTestId("sidebar-ai-group");
    expect(within(group).getByRole("link", { name: "AI Outreach" })).toBeInTheDocument();
  });

  it("is shown for the 'user' role too, but not for clients", () => {
    mockRole = "user";
    const { unmount } = renderAt("/dashboard");
    expect(screen.getByTestId("sidebar-ai-group")).toBeInTheDocument();
    unmount();
    mockRole = "client";
    renderAt("/dashboard");
    expect(screen.queryByTestId("sidebar-ai-group")).toBeNull();
  });
});
