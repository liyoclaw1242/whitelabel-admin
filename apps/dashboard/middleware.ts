import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify, importSPKI } from "jose";

const SESSION_COOKIE = "wl_session";
const ACCESS_COOKIE = "wl_access";
const PUBLIC_PATHS = ["/login"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

async function verifyAccessToken(token: string): Promise<boolean> {
  const publicKeyPem = process.env.JWT_PUBLIC_KEY;
  if (!publicKeyPem) {
    // Without a configured public key (mock / dev), accept the presence of the
    // session cookie alone — production deploys MUST set JWT_PUBLIC_KEY.
    return true;
  }
  try {
    const key = await importSPKI(publicKeyPem, "RS256");
    await jwtVerify(token, key, { algorithms: ["RS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const accessHeader = req.headers.get("authorization") ?? "";
  const headerToken = accessHeader.toLowerCase().startsWith("bearer ")
    ? accessHeader.slice(7)
    : null;
  const cookieToken = req.cookies.get(ACCESS_COOKIE)?.value ?? null;
  const accessToken = headerToken ?? cookieToken;

  // Mock / dev path: session cookie alone suffices when no real access token + no public key configured.
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "1";
  if (useMock && session === "1") return NextResponse.next();

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (accessToken && (await verifyAccessToken(accessToken))) {
    return NextResponse.next();
  }

  // Session cookie exists but no/invalid access token — let the client-side
  // auth-store rehydrate via /api/auth/refresh on the next render. The
  // middleware can't perform fetch refresh because that would expose the
  // refresh cookie ergonomics here; client handles it.
  if (session === "1") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Run on every request except:
     *   - /login (public)
     *   - /_next/* (Next internals)
     *   - /api/* (proxied to backend; auth handled by API)
     *   - static asset extensions
     */
    "/((?!login|_next|api|.*\\.(?:svg|png|jpg|jpeg|webp|ico|css|js|map)$).*)",
  ],
};
