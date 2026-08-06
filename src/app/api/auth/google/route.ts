import { NextRequest, NextResponse } from "next/server";

// GET /api/auth/google?tripId=xxx&name=xxx — initiates Google OAuth with gmail.readonly scope
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const tripId = req.nextUrl.searchParams.get("tripId") || "";
  const customName = req.nextUrl.searchParams.get("name") || "";
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "";

  if (!clientId) {
    return NextResponse.json(
      {
        error: "GOOGLE_CLIENT_ID is not configured in .env",
        hint: "Create an OAuth 2.0 Client ID in Google Cloud Console with redirect URI http://localhost:3000/api/auth/google/callback and add GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET to .env",
      },
      { status: 400 }
    );
  }

  const origin = req.nextUrl.origin || "http://localhost:3000";
  const redirectUri = `${origin}/api/auth/google/callback`;
  const scope = [
    "openid",
    "email",
    "profile",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state: Buffer.from(JSON.stringify({ tripId, name: customName, callbackUrl })).toString("base64"),
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
