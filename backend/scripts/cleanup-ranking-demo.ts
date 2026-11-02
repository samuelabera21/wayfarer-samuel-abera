import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

async function main() {
  console.log("Locating ranking demo places and users...");

  const demoPlaces = await prisma.place.findMany({
    where: {
      name: { in: ["National Museum", "Brand-new Café"] },
    },
    select: { id: true, name: true },
  });

  const demoUsers = await prisma.user.findMany({
    where: {
      name: { startsWith: "Demo Reviewer " },
    },
    select: { id: true },
  });

  if (demoPlaces.length === 0 && demoUsers.length === 0) {
    console.log("No demo records found. Nothing to clean up.");
    await prisma.$disconnect();
    return;
  }

  const demoPlaceIds = demoPlaces.map((p) => p.id);
  const demoUserIds = demoUsers.map((u) => u.id);

  console.log(`Found ${demoPlaces.length} demo places and ${demoUsers.length} demo users.`);

  // 1. Delete any bookings on tour slots belonging to demo places (if created during UI testing)
  const demoSlots = await prisma.tourSlot.findMany({
    where: { placeId: { in: demoPlaceIds } },
    select: { id: true },
  });
  const demoSlotIds = demoSlots.map((s) => s.id);

  if (demoSlotIds.length > 0) {
    const deletedBookings = await prisma.booking.deleteMany({
      where: { slotId: { in: demoSlotIds } },
    });
    console.log(`Deleted ${deletedBookings.count} demo slot bookings.`);

    const deletedSlots = await prisma.tourSlot.deleteMany({
      where: { id: { in: demoSlotIds } },
    });
    console.log(`Deleted ${deletedSlots.count} demo tour slots.`);
  }

  // 2. Delete all reviews linked to demo places or demo users
  const deletedReviews = await prisma.review.deleteMany({
    where: {
      OR: [
        { placeId: { in: demoPlaceIds } },
        { userId: { in: demoUserIds } },
      ],
    },
  });
  console.log(`Deleted ${deletedReviews.count} demo reviews.`);

  // 3. Delete demo places
  if (demoPlaceIds.length > 0) {
    const deletedPlaces = await prisma.place.deleteMany({
      where: { id: { in: demoPlaceIds } },
    });
    console.log(`Deleted ${deletedPlaces.count} demo places.`);
  }

  // 4. Delete demo users
  if (demoUserIds.length > 0) {
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });
    console.log(`Deleted ${deletedUsers.count} demo users.`);
  }

  console.log("\n=======================================================");
  console.log("✅ Cleanup complete! All demo records successfully removed.");
  console.log("Existing seed users, places, and reviews remain untouched.");
  console.log("=======================================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error cleaning up ranking demo:", err);
  process.exit(1);
});

