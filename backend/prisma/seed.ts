
import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

const users = [
    { name: "Samuel" },
    { name: "Fanos" },
    { name: "Nigus" },
];

const places = [
    {
        name: "Debre Berhan Wool Factory",
        category: "Culture",
        description:
            "A historically important textile manufacturing landmark associated with Ethiopian blanket production and the industrial heritage of Debre Berhan.",
        imageUrl: "/places/wool-factory.jpg",
        openingHours: "08:30–17:30",
    },
    {
        name: "Ethio Bernos Hotel",
        category: "Food",
        description:
            "A hotel in Debre Berhan offering accommodation, restaurant services, and facilities for visitors and travelers.",
        imageUrl: "/places/ethio-bernos-hotel.webp",
        openingHours: "07:00–22:00",
    },
    {
        name: "Debre Berhan University",
        category: "Education",
        description:
            "A public university in Debre Berhan contributing to higher education, research, innovation, and academic development in Ethiopia.",
        imageUrl: "/places/university.webp",
        openingHours: "08:30–17:30",
    },
    {
        name: "Angolala Seminesh Kidane Mihiret Church",
        category: "History",
        description:
            "A historic Ethiopian Orthodox pilgrimage site near Debre Berhan known for its religious heritage, holy water, and spiritual significance.",
        imageUrl: "/places/angolala-church.webp",
        openingHours: "06:00–18:00",
    },
    {
        name: "Kuk Yelesh Mariam Monastery",
        category: "History",
        description:
            "An Ethiopian Orthodox monastery near Debre Berhan known for its religious heritage, pilgrimage traditions, and distinctive surroundings.",
        imageUrl: "/places/kuk-yelesh-monastery.jpg",
        openingHours: "06:00–18:00",
    },
    {
        name: "Debre Birhan Tebase St. Gabriel Orthodox Church",
        category: "History",
        description:
            "An Ethiopian Orthodox Tewahedo church in Debre Berhan dedicated to Saint Gabriel and serving as a local religious landmark.",
        imageUrl: "/places/st-gabriel-church.webp",
        openingHours: "06:00–18:00",
    },
    {
        name: "Debre Birhan Main Market",
        category: "Culture",
        description:
            "A traditional marketplace where visitors can explore local products, agricultural goods, traditional items, and everyday community life.",
        imageUrl: "/places/main-market.jpg",
        openingHours: "08:00–18:00",
    },
    {
        name: "Emperor Zera Yacob Square",
        category: "History",
        description:
            "A public square in central Debre Berhan featuring a monument honoring Emperor Zara Yaqob, the historical founder of the city.",
        imageUrl: "/places/zera-yacob-square.jpg",
        openingHours: "06:00–18:00",
    },
    {
        name: "Guassa Community Conservation Area",
        category: "Nature",
        description:
            "A high-altitude conservation area in the Menz region featuring Afro-alpine landscapes, Ethiopian wolves, gelada monkeys, and hiking opportunities.",
        imageUrl: "/places/guassa.webp",
        openingHours: "07:30–18:00",
    },
    {
        name: "Debre Birhan Silase Church",
        category: "History",
        description:
            "A historic Ethiopian Orthodox Tewahedo church in Debre Berhan associated with the city's religious heritage and the reign of Emperor Zara Yaqob.",
        openingHours: "08:00–17:00",
        imageUrl: "/places/silase-church.jpg",
    },
    {
        name: "Haile Hotel Debre Berhan",
        category: "Food",
        description:
            "A modern hotel in Debre Berhan offering accommodation, restaurant services, dining facilities, and Ethiopian hospitality.",
        imageUrl: "/places/haile-hotel.webp",
        openingHours: "07:00–22:00",
    },
];

const reviews = [
    // Debre Birhan Silase Church: 3 reviews
    {
        place: "Debre Birhan Silase Church",
        user: "Samuel",/*  */
        rating: 5,
        body: "A beautiful church with a meaningful religious and historical atmosphere.",
    },
    {
        place: "Debre Birhan Silase Church",
        user: "Fanos",
        rating: 5,
        body: "I enjoyed learning about its religious heritage.",
    },
    {
        place: "Debre Birhan Silase Church",
        user: "Nigus",
        rating: 4,
        body: "A peaceful and historically important place.",
    },

    // Emperor Zera Yacob Square: 3 reviews
    {
        place: "Emperor Zera Yacob Square",
        user: "Samuel",
        rating: 5,
        body: "An interesting public square with historical significance.",
    },
    {
        place: "Emperor Zera Yacob Square",
        user: "Fanos",
        rating: 4,
        body: "A nice place to visit and spend some time.",
    },
    {
        place: "Emperor Zera Yacob Square",
        user: "Nigus",
        rating: 5,
        body: "I enjoyed seeing the monument and the surrounding area.",
    },

    // Debre Birhan Tebase St. Gabriel Orthodox Church: 2 reviews
    {
        place: "Debre Birhan Tebase St. Gabriel Orthodox Church",
        user: "Samuel",
        rating: 5,
        body: "A peaceful religious landmark.",
    },
    {
        place: "Debre Birhan Tebase St. Gabriel Orthodox Church",
        user: "Fanos",
        rating: 4,
        body: "A meaningful place with a welcoming atmosphere.",
    },

    // Debre Birhan Main Market: 3 reviews
    {
        place: "Debre Birhan Main Market",
        user: "Samuel",
        rating: 4,
        body: "A lively market with many local products.",
    },
    {
        place: "Debre Birhan Main Market",
        user: "Fanos",
        rating: 4,
        body: "A good place to experience everyday local life.",
    },
    {
        place: "Debre Birhan Main Market",
        user: "Nigus",
        rating: 5,
        body: "Interesting to explore the traditional products.",
    },

    // Haile Hotel Debre Berhan: 3 reviews
    {
        place: "Haile Hotel Debre Berhan",
        user: "Samuel",
        rating: 5,
        body: "A comfortable place with good dining facilities.",
    },
    {
        place: "Haile Hotel Debre Berhan",
        user: "Fanos",
        rating: 4,
        body: "A pleasant experience and welcoming service.",
    },
    {
        place: "Haile Hotel Debre Berhan",
        user: "Nigus",
        rating: 5,
        body: "Enjoyed the food and the overall atmosphere.",
    },

    // Ethio Bernos Hotel: 2 reviews
    {
        place: "Ethio Bernos Hotel",
        user: "Samuel",
        rating: 4,
        body: "A convenient place for visitors and travelers.",
    },
    {
        place: "Ethio Bernos Hotel",
        user: "Fanos",
        rating: 5,
        body: "A comfortable experience with good hospitality.",
    },

    // Guassa Community Conservation Area: 3 reviews
    {
        place: "Guassa Community Conservation Area",
        user: "Samuel",
        rating: 5,
        body: "Amazing highland scenery and a wonderful outdoor experience.",
    },
    {
        place: "Guassa Community Conservation Area",
        user: "Fanos",
        rating: 5,
        body: "A beautiful destination for nature and hiking.",
    },
    {
        place: "Guassa Community Conservation Area",
        user: "Nigus",
        rating: 4,
        body: "A peaceful natural area worth exploring.",
    },

    // Angolala Seminesh Kidane Mihiret Church: 2 reviews
    {
        place: "Angolala Seminesh Kidane Mihiret Church",
        user: "Samuel",
        rating: 5,
        body: "A meaningful religious and pilgrimage destination.",
    },
    {
        place: "Angolala Seminesh Kidane Mihiret Church",
        user: "Nigus",
        rating: 4,
        body: "A peaceful place with an interesting religious heritage.",
    },

    // Kuk Yelesh Mariam Monastery: 2 reviews
    {
        place: "Kuk Yelesh Mariam Monastery",
        user: "Fanos",
        rating: 5,
        body: "A beautiful place to learn about local religious traditions.",
    },
    {
        place: "Kuk Yelesh Mariam Monastery",
        user: "Nigus",
        rating: 4,
        body: "A peaceful and interesting monastery.",
    },

    // Debre Berhan University: 2 reviews
    {
        place: "Debre Berhan University",
        user: "Samuel",
        rating: 5,
        body: "An important place for education and academic development.",
    },
    {
        place: "Debre Berhan University",
        user: "Fanos",
        rating: 4,
        body: "A nice academic environment.",
    },

    // Debre Berhan Wool Factory: intentionally 1 review
    {
        place: "Debre Berhan Wool Factory",
        user: "Samuel",
        rating: 5,
        body: "An interesting place connected to the city's industrial heritage.",
    },
];

const tourSlots = [
    {
        place: "Debre Birhan Silase Church",
        startsAt: "2026-11-07T09:30:00+03:00",
        capacity: 10,
    },
    {
        place: "Debre Birhan Silase Church",
        startsAt: "2026-11-07T11:30:00+03:00",
        capacity: 10,
    },
    {
        place: "Emperor Zera Yacob Square",
        startsAt: "2026-11-07T09:30:00+03:00",
        capacity: 8,
    },
    {
        place: "Guassa Community Conservation Area",
        startsAt: "2026-11-08T09:00:00+03:00",
        capacity: 12,
    },
    {
        place: "Angolala Seminesh Kidane Mihiret Church",
        startsAt: "2026-11-08T09:30:00+03:00",
        capacity: 10,
    },
    {
        place: "Debre Berhan Wool Factory",
        startsAt: "2026-11-08T09:00:00+03:00",
        capacity: 8,
    },
];

async function seed() {
    try {
        await prisma.$transaction(async (tx) => {
            // Clean tables and reset auto-increment IDs for a pristine seed sequence
            await tx.$executeRawUnsafe(
                'TRUNCATE TABLE "bookings", "reviews", "tour_slots", "places", "users" RESTART IDENTITY CASCADE;'
            );
            // 1. Create or reuse users.
            const userIds = new Map<string, bigint>();

            for (const user of users) {
                const existing = await tx.user.findFirst({
                    where: { name: user.name },
                });

                const savedUser = existing
                    ? existing
                    : await tx.user.create({
                        data: { name: user.name },
                    });

                userIds.set(user.name, savedUser.id);
            }

            // 2. Create or update places.
            const placeIds = new Map<string, bigint>();

            for (const place of places) {
                const existing = await tx.place.findFirst({
                    where: { name: place.name },
                });

                const savedPlace = existing
                    ? await tx.place.update({
                        where: { id: existing.id },
                        data: {
                            category: place.category,
                            description: place.description,
                            openingHours: place.openingHours,
                            imageUrl: place.imageUrl,
                        },
                    })
                    : await tx.place.create({
                        data: place,
                    });

                placeIds.set(place.name, savedPlace.id);
            }

            // 3. Create or update reviews.
            for (const review of reviews) {
                const placeId = placeIds.get(review.place);
                const userId = userIds.get(review.user);

                if (placeId === undefined || userId === undefined) {
                    throw new Error(
                        `Missing place or user for review: ${review.body}`
                    );
                }

                const existing = await tx.review.findFirst({
                    where: { placeId, userId },
                });

                if (existing) {
                    await tx.review.update({
                        where: { id: existing.id },
                        data: {
                            rating: review.rating,
                            body: review.body,
                        },
                    });
                } else {
                    await tx.review.create({
                        data: {
                            placeId,
                            userId,
                            rating: review.rating,
                            body: review.body,
                        },
                    });
                }
            }

            // 4. Create tour slots if they don't already exist.
            for (const slot of tourSlots) {
                const placeId = placeIds.get(slot.place);

                if (placeId === undefined) {
                    throw new Error(`Missing place: ${slot.place}`);
                }

                const startsAt = new Date(slot.startsAt);

                const existing = await tx.tourSlot.findFirst({
                    where: {
                        placeId,
                        startsAt,
                    },
                });

                if (!existing) {
                    await tx.tourSlot.create({
                        data: {
                            placeId,
                            startsAt,
                            capacity: slot.capacity,
                        },
                    });
                }
            }
        });

        console.log("Database seeding completed successfully!");
        console.log(`Users: ${users.length}`);
        console.log(`Places: ${places.length}`);
        console.log(`Reviews: ${reviews.length}`);
        console.log(`Tour slots: ${tourSlots.length}`);
    } catch (error) {
        console.error("Database seeding failed:", error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

seed().catch((error) => {
    console.error("Unexpected seeding error:", error);
    process.exitCode = 1;
});
