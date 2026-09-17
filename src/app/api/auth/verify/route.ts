import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/?login=invalid`);
  }

  const record = await prisma.magicLinkToken.findUnique({ where: { token } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.redirect(`${siteUrl}/?login=expired`);
  }

  await prisma.magicLinkToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  const response = NextResponse.redirect(`${siteUrl}/?login=success`);
  response.cookies.set(SESSION_COOKIE, createSessionToken(record.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
  });
  return response;
}
