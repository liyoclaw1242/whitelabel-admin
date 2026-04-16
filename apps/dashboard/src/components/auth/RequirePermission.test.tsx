import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RequirePermission } from "./RequirePermission";

vi.mock("@/lib/auth-store", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/lib/auth-store";

describe("RequirePermission", () => {
  it("renders children when the permission is granted", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      hasPermission: (p: string) => p === "users.read",
    });

    const html = renderToStaticMarkup(
      <RequirePermission permission="users.read">
        <span>authorized</span>
      </RequirePermission>,
    );
    expect(html).toContain("authorized");
    expect(html).not.toContain("don't have access");
  });

  it("renders default <Forbidden /> when the permission is missing", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      hasPermission: () => false,
    });

    const html = renderToStaticMarkup(
      <RequirePermission permission="users.write">
        <span>secret</span>
      </RequirePermission>,
    );
    expect(html).not.toContain("secret");
    expect(html).toContain("don&#x27;t have access");
    expect(html).toContain("users.write");
  });

  it("renders custom fallback when provided", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      hasPermission: () => false,
    });

    const html = renderToStaticMarkup(
      <RequirePermission permission="x" fallback={<span>nope</span>}>
        <span>secret</span>
      </RequirePermission>,
    );
    expect(html).toContain("nope");
    expect(html).not.toContain("secret");
    expect(html).not.toContain("don&#x27;t have access");
  });
});
