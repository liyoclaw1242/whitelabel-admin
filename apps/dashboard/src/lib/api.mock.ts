import { ProblemError } from "./api";

interface MockUser {
  id: string;
  email: string;
  name: string;
}

const users: MockUser[] = [
  { id: "u_1", email: "admin@example.com", name: "Admin User" },
  { id: "u_2", email: "user@example.com", name: "Regular User" },
];

export async function apiFetchMock<T>(path: string): Promise<T> {
  await new Promise((r) => setTimeout(r, 30));

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

  if (path === "/api/auth/me") {
    return users[0] as T;
  }

  throw new ProblemError({
    type: "about:blank",
    title: "Mock not implemented",
    status: 501,
    detail: `No mock handler for ${path}`,
  });
}
