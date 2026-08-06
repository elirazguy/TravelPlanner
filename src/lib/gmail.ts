import { prisma } from "@/lib/prisma";
import { getSession } from "./session";

export interface BookingEmailMessage {
  id: string;
  subject: string;
  snippet: string;
  bodyText: string;
}

// Get valid Google Access Token for the CURRENT user (auto-refreshing via Refresh Token if expired)
export async function getValidGoogleToken(): Promise<string | null> {
  const user = await getSession();
  if (!user) return null;

  const account = await prisma.userAccount.findUnique({
    where: { id: user.id },
  });

  if (!account || !account.googleAccessToken) {
    return null;
  }

  // If token is still valid (with 2 min buffer), return it
  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() > Date.now() + 120_000) {
    return account.googleAccessToken;
  }

  // Refresh token if expired
  if (!account.googleRefreshToken) {
    return account.googleAccessToken; // Fallback to current token
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return account.googleAccessToken;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: account.googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) return account.googleAccessToken;

    const data = await res.json();
    const newAccessToken = data.access_token;
    const expiresIn = data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.userAccount.update({
      where: { id: user.id },
      data: {
        googleAccessToken: newAccessToken,
        tokenExpiresAt: expiresAt,
      },
    });

    return newAccessToken;
  } catch {
    return account.googleAccessToken;
  }
}

// Query Gmail API for Booking.com emails (English & Hebrew)
export async function fetchBookingEmails(
  query: string = 'booking.com OR Booking'
): Promise<BookingEmailMessage[]> {
  const token = await getValidGoogleToken();
  if (!token) {
    throw new Error("GMAIL_AUTH_REQUIRED");
  }

  // 1. Search messages
  const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=30`;
  const listRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    if (listRes.status === 401) {
      throw new Error("GMAIL_AUTH_REQUIRED");
    }
    throw new Error(`Gmail API query failed: ${listRes.status}`);
  }

  const listData = await listRes.json();
  const messagesList = Array.isArray(listData.messages) ? listData.messages : [];

  if (messagesList.length === 0) {
    return [];
  }

  // 2. Fetch details for each message
  const results: BookingEmailMessage[] = [];

  for (const m of messagesList) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!msgRes.ok) continue;

      const msgData = await msgRes.json();
      const snippet = msgData.snippet || "";

      // Get Subject header
      const headers = msgData.payload?.headers || [];
      const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === "subject");
      const subject = subjectHeader ? subjectHeader.value : "Booking.com Confirmation";

      // Extract body text/HTML from payload parts
      let bodyText = snippet;
      const payload = msgData.payload;

      function extractTextFromParts(parts: any[]): string {
        let text = "";
        for (const p of parts) {
          if (p.mimeType === "text/plain" || p.mimeType === "text/html") {
            if (p.body?.data) {
              const decoded = Buffer.from(p.body.data, "base64url").toString("utf-8");
              text += " " + decoded;
            }
          }
          if (p.parts) {
            text += " " + extractTextFromParts(p.parts);
          }
        }
        return text;
      }

      if (payload?.body?.data) {
        bodyText = Buffer.from(payload.body.data, "base64url").toString("utf-8");
      } else if (payload?.parts) {
        bodyText = extractTextFromParts(payload.parts);
      }

      // Strip excessive HTML tags for cleaner LLM context
      const cleanBody = bodyText
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000); // Limit to 8000 chars per email

      results.push({
        id: m.id,
        subject,
        snippet,
        bodyText: cleanBody,
      });
    } catch {
      // Continue next message
    }
  }

  return results;
}
