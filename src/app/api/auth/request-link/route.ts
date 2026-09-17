import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMagicLinkToken, MAGIC_LINK_TTL_MS } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Single endpoint for both "Subscribe now" (first-time email) and "Log in"
 * (returning subscriber) - both are just "enter your email, get a link".
 * A brand-new email becomes a PENDING subscriber with immediate access;
 * see prisma/schema.prisma's SubscriptionStatus doc comment for why that's
 * an intentional interim state until real Stripe billing replaces it.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      create: { email },
      update: {},
    });

    const token = generateMagicLinkToken();
    await prisma.magicLinkToken.create({
      data: {
        token,
        email,
        subscriberId: subscriber.id,
        expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const link = `${siteUrl}/api/auth/verify?token=${token}`;

    const { sent } = await sendMagicLinkEmail(email, link);

    return NextResponse.json({
      ok: true,
      sent,
      // Only handed back when no email provider is configured, so the site
      // owner (and anyone testing locally) can still sign in today.
      devLink: sent ? undefined : link,
    });
  } catch (err) {
    console.error("[auth/request-link] failed:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
