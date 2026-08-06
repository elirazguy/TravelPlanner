import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { hashPassword, validatePasswordStrength } from "@/lib/auth-crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "יש להזין כתובת אימייל תקינה" },
        { status: 400 }
      );
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name && typeof name === "string" ? name.trim() : null;

    // Check if user already exists
    const existing = await prisma.userAccount.findUnique({
      where: { email: cleanEmail },
    });

    let user;

    if (existing) {
      if (existing.passwordHash) {
        return NextResponse.json(
          { error: "קיים כבר חשבון הרשום עם כתובת אימייל זו. אנא התחבר." },
          { status: 400 }
        );
      }
      // If user exists (e.g. created via OAuth previously), attach passwordHash
      user = await prisma.userAccount.update({
        where: { id: existing.id },
        data: {
          passwordHash: hashPassword(password),
          ...(cleanName && !existing.name ? { name: cleanName } : {}),
        },
      });
    } else {
      // Create new user account
      user = await prisma.userAccount.create({
        data: {
          email: cleanEmail,
          name: cleanName || cleanEmail.split("@")[0],
          passwordHash: hashPassword(password),
        },
      });
    }

    // Create session
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error: any) {
    console.error("Register error detail:", error);
    const errorMessage = error?.message || "שגיאת שרת פנימית";
    return NextResponse.json(
      { error: `אירעה שגיאה ברישום המשתמש: ${errorMessage}` },
      { status: 500 }
    );
  }
}
