import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../src/db/db.js";
import { hashPassword } from "../src/utils/utils.js";

async function main() {
  const now = new Date();

  let password = "Admin@123";
  password = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: "Samir Khan",
      email: "admin@gmail.com",
      password,
      role: "Admin",
      status: "Active",
      phone: "99999999",
      location: "Jaipur, India",
      avatar:
        "https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes.png",
      totalSpent: new Decimal(0),
      joinDate: now,
      createdAt: now,
    },
  });

  console.log("✅ Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
