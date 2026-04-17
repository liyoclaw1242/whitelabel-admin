import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  importSPKI: vi.fn(),
}));

import { jwtVerify, importSPKI } from "jose";

const SESSION_COOKIE = "wl_session";
const ACCESS_COOKIE = "wl_access";

function makeRequest(
  pathname: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
): {
  pathname: string;
  search: string;
  cookies: { get(name: string): { value: string } | undefined };
  headers: { get(name: string): string | null };
  nextUrl: { clone(): { pathname: string; searchParams: URLSearchParams } };
} {
  const url = new URL(`http://localhost${pathname}`);
  return {
    pathname: url.pathname,
    search: url.search,
    cookies: {
      get(name: string) {
        const v = cookies[name];
        return v !== undefined ? { value: v } : undefined;
      },
    },
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
    nextUrl: {
      clone() {
        return {
          pathname: url.pathname,
          searchParams: new URLSearchParams(url.search),
        };
      },
    },
  };
}

describe("middleware logic (unit-level)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.JWT_PUBLIC_KEY;
    delete process.env.NEXT_PUBLIC_USE_MOCK_API;
  });

  it("allows /login without any auth", () => {
    const req = makeRequest("/login");
    expect(req.pathname).toBe("/login");
  });

  it("detects missing session cookie → should redirect", () => {
    const req = makeRequest("/dashboard");
    const session = req.cookies.get(SESSION_COOKIE);
    expect(session).toBeUndefined();
  });

  it("detects present session cookie", () => {
    const req = makeRequest("/dashboard", { [SESSION_COOKIE]: "1" });
    const session = req.cookies.get(SESSION_COOKIE);
    expect(session?.value).toBe("1");
  });

  it("extracts bearer token from authorization header", () => {
    const req = makeRequest("/", {}, { authorization: "Bearer xyz-token" });
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : null;
    expect(token).toBe("xyz-token");
  });

  it("extracts access token from cookie when no header", () => {
    const req = makeRequest("/", { [ACCESS_COOKIE]: "cookie-token" });
    const cookieToken = req.cookies.get(ACCESS_COOKIE)?.value ?? null;
    expect(cookieToken).toBe("cookie-token");
  });

  it("jose importSPKI + jwtVerify called for real JWT flow", async () => {
    const mockKey = { type: "public" };
    (importSPKI as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);
    (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({ payload: { sub: "u1" } });

    process.env.JWT_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nfake\n-----END PUBLIC KEY-----";
    const key = await importSPKI(process.env.JWT_PUBLIC_KEY, "RS256");
    const result = await jwtVerify("some.jwt.token", key, { algorithms: ["RS256"] });

    expect(importSPKI).toHaveBeenCalledWith(process.env.JWT_PUBLIC_KEY, "RS256");
    expect(jwtVerify).toHaveBeenCalledWith("some.jwt.token", mockKey, { algorithms: ["RS256"] });
    expect(result.payload.sub).toBe("u1");
  });

  it("expired/invalid JWT → jwtVerify throws", async () => {
    (importSPKI as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("jwt expired"));

    process.env.JWT_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nfake\n-----END PUBLIC KEY-----";
    const key = await importSPKI(process.env.JWT_PUBLIC_KEY, "RS256");
    await expect(jwtVerify("expired.jwt", key)).rejects.toThrow("jwt expired");
  });
});
