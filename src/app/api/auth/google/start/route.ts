import { NextResponse, type NextRequest } from "next/server";

/** Redirects the user to Google's real consent screen for Calendar + email. */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const book = new URL("/book", request.url);

  if (!clientId || !clientSecret) {
    book.searchParams.set("gcal", "notconfigured");
    return NextResponse.redirect(book);
  }

  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email",
  );
  // offline + consent so a refresh token is minted for scheduling later
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("include_granted_scopes", "true");
  const state = crypto.randomUUID();
  auth.searchParams.set("state", state);

  const host = new URL(request.url).host;
  const res = NextResponse.redirect(auth);
  res.cookies.set("gcal.state", state, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    secure: !host.startsWith("localhost") && !host.startsWith("127."),
  });
  return res;
}