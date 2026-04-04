import { getSessionCookie } from "better-auth/cookies";
import { getLocale } from "next-intl/server";
import { NextResponse, type NextRequest } from "next/server";

const signInRoutes = ["/sign-in", "/sign-up"];


export default async function middleware(request: NextRequest) {

  // const sessionCookie = getSessionCookie(request);

  // const isSignInRoute = signInRoutes.includes(request.nextUrl.pathname);

  // if (isSignInRoute && !sessionCookie) {
  //   return NextResponse.next();
  // }

  // if (!isSignInRoute && !sessionCookie) {
  //   return NextResponse.redirect(new URL("/sign-in", request.url));
  // }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};


