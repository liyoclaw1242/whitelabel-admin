import { describe, expect, it } from "vitest";
import { apiFetchMock } from "./api.mock";
import { ProblemError } from "./api";

describe("apiFetchMock auth handlers", () => {
  it("login succeeds with admin@example.com / password", async () => {
    const res = await apiFetchMock<{
      access_token: string;
      user: { email: string; permissions: string[] };
    }>("/api/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "password" },
    });
    expect(res.access_token).toBeTruthy();
    expect(res.user.email).toBe("admin@example.com");
    expect(res.user.permissions).toContain("users.read");
    expect(res.user.permissions).toContain("theme.edit");
  });

  it("login fails with wrong password → ProblemError(401)", async () => {
    await expect(
      apiFetchMock("/api/auth/login", {
        method: "POST",
        body: { email: "admin@example.com", password: "WRONG" },
      }),
    ).rejects.toMatchObject({
      name: "ProblemError",
      status: 401,
      problem: { detail: expect.stringContaining("incorrect") },
    });
  });

  it("login fails with unknown user → ProblemError(401)", async () => {
    await expect(
      apiFetchMock("/api/auth/login", {
        method: "POST",
        body: { email: "ghost@example.com", password: "password" },
      }),
    ).rejects.toBeInstanceOf(ProblemError);
  });

  it("refresh returns a fresh access token", async () => {
    const res = await apiFetchMock<{ access_token: string }>(
      "/api/auth/refresh",
      { method: "POST" },
    );
    expect(res.access_token).toBeTruthy();
  });

  it("regular user has limited permissions", async () => {
    const res = await apiFetchMock<{
      user: { permissions: string[] };
    }>("/api/auth/login", {
      method: "POST",
      body: { email: "user@example.com", password: "password" },
    });
    expect(res.user.permissions).toEqual(["users.read"]);
    expect(res.user.permissions).not.toContain("theme.edit");
  });
});
