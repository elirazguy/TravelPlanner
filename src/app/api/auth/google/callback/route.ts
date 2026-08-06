import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

// GET /api/auth/google/callback — handles Google OAuth redirect & token exchange
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state") || "";
  let tripId = "";
  let customName = "";
  let callbackUrl = "";
  try {
    const parsedState = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf-8"));
    tripId = parsedState.tripId || "";
    customName = parsedState.name || "";
    callbackUrl = parsedState.callbackUrl || "";
  } catch (e) {
    // fallback if it wasn't valid base64 JSON
    tripId = stateRaw;
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Invalid OAuth callback parameter or missing credentials" },
      { status: 400 }
    );
  }

  const origin = req.nextUrl.origin || "http://localhost:3000";
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    // Exchange auth code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Token exchange failed: ${tokenRes.status} ${errText}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;

    // Fetch user info to get email, name, and picture
    let userEmail: string | null = null;
    let userName: string | null = null;
    let userPicture: string | null = null;

    if (accessToken) {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => null);
      
      if (userRes && userRes.ok) {
        const u = await userRes.json();
        userEmail = u.email || null;
        userName = u.name || null;
        userPicture = u.picture || null;
      }
    }

    if (!userEmail) {
      throw new Error("Could not retrieve email from Google. Email is required.");
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const finalName = customName || userName;

    // Save tokens securely in DB based on email
    const account = await prisma.userAccount.upsert({
      where: { email: userEmail },
      create: {
        email: userEmail,
        name: finalName,
        picture: userPicture,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken || null,
        tokenExpiresAt: expiresAt,
      },
      update: {
        name: finalName,
        picture: userPicture,
        googleAccessToken: accessToken,
        ...(refreshToken ? { googleRefreshToken: refreshToken } : {}),
        tokenExpiresAt: expiresAt,
      },
    });

    // Migrate orphaned trips and packing items if this is the first login
    // This ensures data isn't lost for existing single-user apps
    await prisma.trip.updateMany({
      where: { userId: null },
      data: { userId: account.id },
    });
    await prisma.packingItem.updateMany({
      where: { userId: null },
      data: { userId: account.id },
    });

    // Create a new session cookie
    await createSession(account.id);

    const targetUrl = callbackUrl
      ? `${origin}${callbackUrl}`
      : tripId
      ? `${origin}/trips/${tripId}?gmail_connected=true`
      : `${origin}/`;
    return NextResponse.redirect(targetUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

