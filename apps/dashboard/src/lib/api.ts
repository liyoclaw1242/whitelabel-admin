import type { paths, operations } from "./api-types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export interface ProblemPayload {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export class ProblemError extends Error {
  readonly problem: ProblemPayload;
  readonly status: number;
  constructor(problem: ProblemPayload) {
    super(problem.title || `HTTP ${problem.status}`);
    this.name = "ProblemError";
    this.problem = problem;
    this.status = problem.status;
  }
}

export class NetworkError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "NetworkError";
    this.cause = cause;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

let accessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}

interface ApiFetchInit extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  __retried?: boolean;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access_token?: string };
    if (data.access_token) {
      setAccessToken(data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { body, headers, __retried, ...rest } = init;

  const finalHeaders = new Headers(headers);
  if (accessToken && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let finalBody: BodyInit | null | undefined;
  if (body == null || body instanceof FormData || body instanceof Blob || typeof body === "string") {
    finalBody = body as BodyInit | null | undefined;
  } else {
    if (!finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
    }
    finalBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    });
  } catch (err) {
    throw new NetworkError(
      err instanceof Error ? err.message : "Network request failed",
      err,
    );
  }

  if (response.status === 401 && !__retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, { ...init, __retried: true });
    }
    throw new UnauthorizedError();
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    const ctype = response.headers.get("Content-Type") ?? "";
    if (ctype.includes("application/json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/problem+json")) {
    const problem = (await response.json()) as ProblemPayload;
    throw new ProblemError(problem);
  }

  let detail: string | undefined;
  try {
    detail = await response.text();
  } catch {
    detail = undefined;
  }
  throw new ProblemError({
    type: "about:blank",
    title: response.statusText || `HTTP ${response.status}`,
    status: response.status,
    detail,
  });
}

export type ApiPaths = paths;
export type ApiOperations = operations;

export type { paths as Paths, operations as Operations } from "./api-types";
