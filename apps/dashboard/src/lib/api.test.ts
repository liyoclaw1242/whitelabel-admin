import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  NetworkError,
  ProblemError,
  setAccessToken,
  UnauthorizedError,
} from "./api";

const originalFetch = globalThis.fetch;

function mockResponse(
  body: unknown,
  init: { status?: number; contentType?: string } = {},
): Response {
  const status = init.status ?? 200;
  const headers = new Headers();
  if (init.contentType) headers.set("Content-Type", init.contentType);
  const text =
    init.contentType === "application/json" ||
    init.contentType === "application/problem+json"
      ? JSON.stringify(body)
      : typeof body === "string"
        ? body
        : JSON.stringify(body);
  return new Response(text, { status, headers });
}

describe("apiFetch", () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on 2xx", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockResponse({ ok: true, value: 42 }, { contentType: "application/json" }),
    );

    const result = await apiFetch<{ ok: boolean; value: number }>("/api/things");
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("throws ProblemError on RFC 7807 4xx response", async () => {
    const problem = {
      type: "https://example.com/probs/validation",
      title: "Validation failed",
      status: 422,
      detail: "Email is required",
    };
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockResponse(problem, { status: 422, contentType: "application/problem+json" }),
    );

    await expect(apiFetch("/api/users")).rejects.toMatchObject({
      name: "ProblemError",
      status: 422,
      problem: { title: "Validation failed", status: 422 },
    });
  });

  it("throws NetworkError when fetch rejects", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(apiFetch("/api/users")).rejects.toBeInstanceOf(NetworkError);
  });

  it("attaches Authorization bearer header when access token is set", async () => {
    setAccessToken("token-abc");
    const fetchSpy = vi.fn().mockResolvedValueOnce(
      mockResponse({}, { contentType: "application/json" }),
    );
    globalThis.fetch = fetchSpy;

    await apiFetch("/api/me");

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-abc");
  });

  it("attempts silent refresh on 401 then retries the original request", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(null, { status: 401 }))
      .mockResolvedValueOnce(
        mockResponse(
          { access_token: "new-token" },
          { status: 200, contentType: "application/json" },
        ),
      )
      .mockResolvedValueOnce(
        mockResponse({ ok: true }, { contentType: "application/json" }),
      );
    globalThis.fetch = fetchSpy;

    const result = await apiFetch<{ ok: boolean }>("/api/protected");

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    const refreshCall = fetchSpy.mock.calls[1];
    expect(refreshCall?.[0]).toContain("/api/auth/refresh");
  });

  it("throws UnauthorizedError when refresh fails on 401", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(null, { status: 401 }))
      .mockResolvedValueOnce(mockResponse(null, { status: 401 }));
    globalThis.fetch = fetchSpy;

    await expect(apiFetch("/api/protected")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("serializes object body as JSON with Content-Type header", async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(
      mockResponse({}, { contentType: "application/json" }),
    );
    globalThis.fetch = fetchSpy;

    await apiFetch("/api/users", { method: "POST", body: { email: "a@b.com" } });

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ email: "a@b.com" }));
  });
});
