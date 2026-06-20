import { NextResponse, type NextRequest } from "next/server";
import {
  detectLocaleFromAcceptLanguage,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "~/lib/locale";

function appendCookie(
  cookieHeader: string | null,
  name: string,
  value: string,
): string {
  const nextCookie = `${name}=${value}`;
  return cookieHeader ? `${cookieHeader}; ${nextCookie}` : nextCookie;
}

export default function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let detectedLocale: AppLocale | null = null;

  if (!request.cookies.has(LOCALE_COOKIE_NAME)) {
    detectedLocale = detectLocaleFromAcceptLanguage(
      request.headers.get("accept-language"),
    );
    requestHeaders.set(
      "cookie",
      appendCookie(
        request.headers.get("cookie"),
        LOCALE_COOKIE_NAME,
        detectedLocale,
      ),
    );
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (detectedLocale) {
    response.cookies.set(LOCALE_COOKIE_NAME, detectedLocale, {
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Run proxy on all routes except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
