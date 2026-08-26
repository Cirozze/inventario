import { NextRequest, NextResponse } from "next/server";
import { isPasswordCorrect } from "@/lib/auth/config";
import { createSessionCookieValue, getCookieExpiryDays, SESSION_COOKIE_NAME } from "@/lib/auth/cookie";

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const password = body.password ?? "";

  let correct: boolean;
  try {
    correct = isPasswordCorrect(password);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Configurazione server mancante" }, { status: 500 });
  }

  if (!correct) {
    return NextResponse.json({ error: "Password errata" }, { status: 401 });
  }

  const cookieValue = await createSessionCookieValue();
  const expiryDays = getCookieExpiryDays();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiryDays * 24 * 60 * 60,
  });

  return response;
}
