import "dotenv/config";
import { prisma } from "@/lib/prisma";

const OWNER_EMAIL = "buildmatepodcast@gmail.com";

(async () => {
  const subscriber = await prisma.subscriber.upsert({
    where: { email: OWNER_EMAIL },
    create: { email: OWNER_EMAIL, status: "ACTIVE", isFreeAccess: true },
    update: { status: "ACTIVE", isFreeAccess: true },
  });
  console.log("Owner free-access account ready:", subscriber);
  await prisma.$disconnect();
})();
