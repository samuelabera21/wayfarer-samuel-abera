import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

async function main() {
  console.log("Checking for existing demo records...");

  const existingMuseum = await prisma.place.findFirst({
    where: { name: "National Museum" },
  });
  const existingCafe = await prisma.place.findFirst({
    where: { name: "Brand-new Café" },
  });

  if (existingMuseum || existingCafe) {
    console.log("Demo places already exist in database. Aborting to avoid duplicates.");
    console.log("Run 'npx tsx scripts/cleanup-ranking-demo.ts' first if you wish to reset demo data.");
    await prisma.$disconnect();
    return;
  }

  console.log("Creating 313 dedicated demo users...");
  // Create 313 demo users: 312 for the museum + 1 for the cafe
  const userData = Array.from({ length: 313 }, (_, i) => ({
    name: `Demo Reviewer ${i + 1}`,
  }));

  await prisma.user.createMany({
    data: userData,
  });

  const createdUsers = await prisma.user.findMany({
    where: {
      name: { startsWith: "Demo Reviewer " },
    },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  if (createdUsers.length < 313) {
    throw new Error(`Failed to create all 313 demo users (created: ${createdUsers.length})`);
  }

  console.log("Creating demo places: National Museum and Brand-new Café...");
  const museum = await prisma.place.create({
    data: {
      name: "National Museum",
      category: "History",
      description:
        "A national landmark showcasing regional archaeological treasures, imperial history, and Ethiopian cultural heritage.",
      openingHours: "08:30–17:30",
      imageUrl:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    },
  });

  const cafe = await prisma.place.create({
    data: {
      name: "Brand-new Café",
      category: "Food",
      description:
        "A newly opened boutique coffee house serving freshly roasted Ethiopian coffee and handmade pastries.",
      openingHours: "07:00–21:00",
      imageUrl:
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    },
  });

  console.log("Adding 312 reviews for National Museum (~4.70 average)...");
  // 218 reviews with 5 stars + 94 reviews with 4 stars
  // Sum = 218 * 5 + 94 * 4 = 1090 + 376 = 1466
  // Average = 1466 / 312 = 4.6987 ≈ 4.70
  const museumReviews = [];
  for (let i = 0; i < 312; i++) {
    const isFiveStar = i < 218;
    museumReviews.push({
      placeId: museum.id,
      userId: createdUsers[i]!.id,
      rating: isFiveStar ? 5 : 4,
      body: isFiveStar
        ? "Excellent collection and very informative guided experience."
        : "Fascinating historical artefacts and friendly guides.",
    });
  }

  await prisma.review.createMany({
    data: museumReviews,
  });

  console.log("Adding 1 review for Brand-new Café (5.0 rating)...");
  await prisma.review.create({
    data: {
      placeId: cafe.id,
      userId: createdUsers[312]!.id,
      rating: 5,
      body: "Outstanding coffee, wonderful service, and beautiful setting!",
    },
  });

  console.log("\n=======================================================");
  console.log("✅ Successfully inserted ranking demo data!");
  console.log(`- Place: "${museum.name}" (ID: ${museum.id}) with 312 reviews (~4.70 avg)`);
  console.log(`- Place: "${cafe.name}" (ID: ${cafe.id}) with 1 review (5.00 avg)`);
  console.log(`- Created ${createdUsers.length} temporary users ("Demo Reviewer 1" to "313")`);
  console.log("=======================================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error creating ranking demo:", err);
  process.exit(1);
});

