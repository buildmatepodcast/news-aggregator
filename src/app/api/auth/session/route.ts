import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessFromRequest } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { email, hasAccess } = await getAccessFromRequest(req);
  if (!email) {
    return NextResponse.json({ loggedIn: false, hasAccess: false });
  }
  const subscriber = await prisma.subscriber.findUnique({ where: { email } });
  return NextResponse.json({ loggedIn: true, email, hasAccess, status: subscriber?.status ?? null });
}
