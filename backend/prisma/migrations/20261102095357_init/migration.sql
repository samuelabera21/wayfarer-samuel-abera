-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "opening_hours" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" BIGSERIAL NOT NULL,
    "place_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_slots" (
    "id" BIGSERIAL NOT NULL,
    "place_id" BIGINT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" BIGSERIAL NOT NULL,
    "slot_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "seats" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_places_category" ON "places"("category");

-- CreateIndex
CREATE INDEX "idx_reviews_user_id" ON "reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_reviews_place_user" ON "reviews"("place_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_tour_slots_place_starts_at" ON "tour_slots"("place_id", "starts_at");

-- CreateIndex
CREATE INDEX "idx_bookings_user_id" ON "bookings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_bookings_slot_user" ON "bookings"("slot_id", "user_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_slots" ADD CONSTRAINT "tour_slots_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "tour_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_rating_check"
CHECK ("rating" BETWEEN 1 AND 5);

-- AddCheckConstraint
ALTER TABLE "tour_slots"
ADD CONSTRAINT "tour_slots_capacity_check"
CHECK ("capacity" > 0);

-- AddCheckConstraint
ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_seats_check"
CHECK ("seats" > 0);