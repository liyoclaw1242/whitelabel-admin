import { ProblemError } from "./api";

interface MockUser {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

const users: MockUser[] = [
  {
    id: "u_1",
    email: "admin@example.com",
    name: "Admin User",
    permissions: ["users.read", "users.write", "theme.edit"],
  },
  {
    id: "u_2",
    email: "user@example.com",
    name: "Regular User",
    permissions: ["users.read"],
  },
];

const MOCK_PASSWORD = "password";
const MOCK_ACCESS_TOKEN = "mock.jwt.token.placeholder";

interface MockInit {
  body?: unknown;
  method?: string;
}

export async function apiFetchMock<T>(
  path: string,
  init: MockInit = {},
): Promise<T> {
  await new Promise((r) => setTimeout(r, 30));

  if (path === "/api/auth/login" && init.method === "POST") {
    const body = init.body as { email?: string; password?: string } | undefined;
    const email = body?.email;
    const password = body?.password;
    const user = users.find((u) => u.email === email);
    if (!user || password !== MOCK_PASSWORD) {
      throw new ProblemError({
        type: "about:blank",
        title: "Invalid credentials",
        status: 401,
        detail: "Email or password is incorrect.",
      });
    }
    return { access_token: MOCK_ACCESS_TOKEN, user } as T;
  }

  if (path === "/api/auth/refresh" && init.method === "POST") {
    return { access_token: MOCK_ACCESS_TOKEN, user: users[0] } as T;
  }

  if (path === "/api/auth/me") {
    return users[0] as T;
  }

  if (path === "/api/users" || path.startsWith("/api/users?")) {
    return { items: users, page: 1, limit: 20, total: users.length } as T;
  }

  if (path.startsWith("/api/users/")) {
    const id = path.slice("/api/users/".length).split("?")[0];
    const user = users.find((u) => u.id === id);
    if (!user) {
      throw new ProblemError({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: `User ${id} not found`,
      });
    }
    return user as T;
  }

  throw new ProblemError({
    type: "about:blank",
    title: "Mock not implemented",
    status: 501,
    detail: `No mock handler for ${init.method ?? "GET"} ${path}`,
  });
}
