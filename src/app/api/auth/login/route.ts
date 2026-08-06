import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { verifyPassword } from "@/lib/auth-crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "יש להזין אימייל וסיסמה" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user
    const user = await prisma.userAccount.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "פרטי ההתחברות שגויים. נסה שוב או התחבר באמצעות גוגל." },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "פרטי ההתחברות שגויים. נסה שוב." },
        { status: 401 }
      );
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
    console.error("Login error detail:", error);
    const errorMessage = error?.message || "שגיאת שרת פנימית";
    return NextResponse.json(
      { error: `אירעה שגיאה בהתחברות: ${errorMessage}` },
      { status: 500 }
    );
  }
}
