import { NextResponse, type NextRequest } from "next/server";

/**
 * Real OAuth callback: exchanges the one-time code for tokens (with the
 * client secret, server-side only), then hands the browser its tokens via a
 * tiny handler page that stores them and returns to /book. No database —
 * the tokens belong to the browser that consented.
 */
export async function GET(request: NextRequest) {
  const book = new URL("/book", request.url);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieState = request.cookies.get("gcal.state")?.value;

  if (error) {
    book.searchParams.set("gcal", "denied");
    return NextResponse.redirect(book);
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) {
    book.searchParams.set("gcal", "notconfigured");
    return NextResponse.redirect(book);
  }

  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    book.searchParams.set("gcal", "exchange_failed");
    return NextResponse.redirect(book);
  }
  const j = (await res.json()) as { access_token: string; expires_in?: number; refresh_token?: string; id_token?: string };
  if (!j.refresh_token) {
    // prompt=consent should always mint one; if it didn't, don't store a
    // useless connection
    book.searchParams.set("gcal", "no_refresh");
    return NextResponse.redirect(book);
  }

  // the email rides inside the id_token payload (base64url)
  let email: string | undefined;
  try {
    const payload = j.id_token?.split(".")[1];
    if (payload) email = (JSON.parse(atobPayload(payload)) as { email?: string }).email;
  } catch {
    /* optional */
  }

  const tokens = {
    access: j.access_token,
    refresh: j.refresh_token,
    expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000,
    email,
  };

  const html = `<!doctype html><html><head><title>Connecting Minutes to Google Calendar…</title></head>
<body><p>Connected — returning to Minutes…</p>
<script>
localStorage.setItem("minutes.gcal", ${JSON.stringify(JSON.stringify(tokens))});
location.replace("/book?gcal=connected");
</script>
<noscript><a href="/book?gcal=connected">Continue</a></noscript></body></html>`;
  const out = new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  out.cookies.delete("gcal.state");
  return out;
}

function atobPayload(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(
    Array.from(atobSafe(b64))
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
}

function atobSafe(b64: string): string {
  // Buffer exists in the Node runtime these handlers run in
  return Buffer.from(b64, "base64").toString("binary");
}