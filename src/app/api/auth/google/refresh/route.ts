/** Exchanges a refresh token for a fresh access token — the client secret
 * stays server-side, and only the short-lived access token goes back. */
export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    return Response.json({ error: "notconfigured" }, { status: 501 });

  let refresh: string | undefined;
  try {
    ({ refresh } = (await request.json()) as { refresh?: string });
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!refresh) return Response.json({ error: "bad_request" }, { status: 400 });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return Response.json({ error: "refresh_failed" }, { status: 401 });
  const j = (await res.json()) as { access_token: string; expires_in?: number };
  return Response.json({
    access: j.access_token,
    expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000,
  });
}