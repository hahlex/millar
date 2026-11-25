/**
 * Cloudflare Worker entrypoint for Millar Design System Portal.
 * Serves the static Next.js export (basePath: "/millar") safely on its own isolated
 * origin (*.workers.dev or future Service Binding on hahlex.com/millar per ADR-0003).
 */

interface AssetsFetcher {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
}

interface Env {
  ASSETS: AssetsFetcher;
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/") {
      return Response.redirect(new URL("/millar/", url.origin).toString(), 302);
    }

    if (pathname === "/millar") {
      return Response.redirect(new URL("/millar/", url.origin).toString(), 301);
    }

    if (pathname === "/favicon.ico") {
      const iconUrl = new URL("/brand/hahlex-mark-color.svg", url.origin);
      const res = await env.ASSETS.fetch(new Request(iconUrl.toString(), request));
      return withSecurityHeaders(res);
    }

    if (pathname.startsWith("/millar/")) {
      const rewritten = new URL(request.url);
      rewritten.pathname = pathname.slice("/millar".length) || "/";
      const assetResponse = await env.ASSETS.fetch(new Request(rewritten.toString(), request));
      return withSecurityHeaders(assetResponse);
    }

    const passthrough = await env.ASSETS.fetch(request);
    return withSecurityHeaders(passthrough);
  },
};
