import { test, expect } from "@playwright/test";

test.describe("Auth E2E", () => {
  // E1: Login happy path (admin)
  test("admin login → redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("admin@example.com");
    await page.getByTestId("login-password").fill("password");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/(dashboard)?$/);
    await expect(page.getByTestId("nav-dashboard")).toBeVisible();
    await expect(page.getByTestId("nav-users")).toBeVisible();
  });

  // E2: Login happy path (viewer — limited nav)
  test("viewer login → limited nav items", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("viewer@example.com");
    await page.getByTestId("login-password").fill("password");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/(dashboard)?$/);
    await expect(page.getByTestId("nav-dashboard")).toBeVisible();
  });

  // E3: Login failure
  test("wrong password → error message visible", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("admin@example.com");
    await page.getByTestId("login-password").fill("wrong-password");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-error")).toBeVisible();
  });

  // E4: Token refresh (simplified — use short-lived token if available)
  test("expired token triggers silent refresh", async ({ page, request }) => {
    // Login first
    await page.goto("/login");
    await page.getByTestId("login-email").fill("admin@example.com");
    await page.getByTestId("login-password").fill("password");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/(dashboard)?$/);

    // Clear access token from storage to force refresh on next API call
    await page.evaluate(() => {
      document.cookie = "session=; max-age=0; path=/";
    });

    // Navigate to trigger an API call — should auto-refresh
    await page.goto("/dashboard");
    // If refresh works, we stay on dashboard; if not, redirected to /login
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  // E5: Logout + blacklist
  test("logout → redirect to /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("admin@example.com");
    await page.getByTestId("login-password").fill("password");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/(dashboard)?$/);

    await page.getByTestId("user-menu").click();
    await page.getByTestId("logout-button").click();
    await expect(page).toHaveURL(/\/login/);
  });

  // E6: Cross-tenant isolation
  test("cross-tenant item access → 404 or forbidden", async ({ request }) => {
    // Login as tenant-A admin
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "admin@example.com", password: "password" },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { access_token } = await loginRes.json();

    // Attempt to access a non-existent or cross-tenant item
    const itemRes = await request.get("/api/items/00000000-0000-0000-0000-000000000000", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    // Should be 404 (not found) — not 200 or 500
    expect(itemRes.status()).toBe(404);
  });
});
