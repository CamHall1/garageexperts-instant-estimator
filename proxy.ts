import { NextResponse, type NextRequest } from "next/server";

/**
 * Security headers, applied at the edge. frame-ancestors is the one that
 * matters most here: /embed must allow only the configured landing-page
 * origins, while every other route stays locked down. X-Frame-Options is
 * only sent where it can't conflict with an allowed embed origin.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const isEmbed = request.nextUrl.pathname.startsWith("/embed");

  const allowedOrigins = (process.env.EMBED_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const frameAncestors = isEmbed
    ? allowedOrigins.length > 0
      ? allowedOrigins.join(" ")
      : "'none'"
    : "'none'";

  response.headers.set(
    "Content-Security-Policy",
    [
      `frame-ancestors ${frameAncestors}`,
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://maps.googleapis.com https://www.google-analytics.com https://challenges.cloudflare.com",
      "frame-src 'self' https://challenges.cloudflare.com",
    ].join("; "),
  );

  if (!isEmbed) {
    response.headers.set("X-Frame-Options", "DENY");
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
