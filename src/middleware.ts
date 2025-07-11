import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing.public";

export default createMiddleware(routing);

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!api|dashboard|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    //'/(api|trpc)(.*)',
  ],
};