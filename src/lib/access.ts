import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

/** Any status other than CANCELED currently grants access - see the
 * SubscriptionStatus doc comment in prisma/schema.prisma for why PENDING
 * (pre-Stripe interim state) counts as access too. */
export async function hasActiveAccess(email: string | null): Promise<boolean> {
  if (!email) return false;
  const subscriber = await prisma.subscriber.findUnique({ where: { email } });
  if (!subscriber) return false;
  return subscriber.isFreeAccess || subscriber.status === "ACTIVE" || subscriber.status === "PENDING";
}

export function getSessionEmail(req: NextRequest): string | null {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function getAccessFromRequest(req: NextRequest): Promise<{ email: string | null; hasAccess: boolean }> {
  const email = getSessionEmail(req);
  const hasAccess = await hasActiveAccess(email);
  return { email, hasAccess };
}
