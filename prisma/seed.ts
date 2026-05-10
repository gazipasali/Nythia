import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      username,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Admin user ready: ${admin.username} (${admin.id})`);

  const announcementsCount = await prisma.announcement.count();
  if (announcementsCount === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          title: "Welcome to Nythia",
          body: "This panel is in active development. Tools will appear in the left sidebar.",
        },
        {
          title: "Cookie Converter is live",
          body: "Convert between Netscape, JSON and Header string cookie formats.",
        },
      ],
    });
    console.log("Seeded 2 announcements.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
