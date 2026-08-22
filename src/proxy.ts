import { NextResponse, type NextRequest } from "next/server";
import {
  LANGUAGE_COOKIE_NAME,
  resolveInitialLanguage,
  resolveLanguageFromPathname,
} from "@/core/i18n/language-config";

export function proxy(request: NextRequest) {
  const pathnameLanguage = resolveLanguageFromPathname(request.nextUrl.pathname);
  const cookieLanguage = resolveInitialLanguage(
    request.cookies.get(LANGUAGE_COOKIE_NAME)?.value,
    "es",
  );
  const resolvedLanguage = pathnameLanguage ?? cookieLanguage;

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-resolved-language", resolvedLanguage);

  const response = NextResponse.next({
    request: {
      headers: forwardedHeaders,
    },
  });

  if (pathnameLanguage && request.cookies.get(LANGUAGE_COOKIE_NAME)?.value !== pathnameLanguage) {
    response.cookies.set(LANGUAGE_COOKIE_NAME, pathnameLanguage, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
