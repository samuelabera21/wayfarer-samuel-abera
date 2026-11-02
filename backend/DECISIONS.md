# Architectural & Engineering Decisions — Wayfarer

This document details key engineering decisions made for the Wayfarer application, explaining why specific solutions were chosen, their mathematical and architectural backing, and how they prevent common full-stack bugs by design.

---

## 1. Honest Ranking: Bayesian Weighted Rating

### The Problem
Simple arithmetic averages (`sum(ratings) / count`) are misleading on platforms with sparse or uneven review counts. 
For example:
- A brand-new café with a single 5-star review (average: 5.0, reviews: 1) would rank higher than an established museum with 312 reviews averaging 4.7.
- A single biased review can distort a place's position when traffic is low.

### The Chosen Solution: Bayesian Weighted Rating
To solve this, we implemented **Bayesian Weighted Rating** (similar to the IMDB weighted formula).

#### Formula:
$$W = \left(\frac{v}{v + m}\right) \cdot R + \left(\frac{m}{v + m}\right) \cdot C$$

Where:
- **$W$**: Final weighted rating (ranking score).
- **$R$**: Arithmetic average rating of the individual place.
- **$v$**: Number of reviews for that place.
- **$m$**: Minimum review threshold / confidence weight (chosen as **$m = 5$**).
- **$C$**: Overall average rating across **all individual reviews** in the system.

### Why $m = 5$?
- $m$ acts as a prior belief weight (equivalent to assuming $m$ baseline reviews of average value $C$).
- When a place has very few reviews ($v \ll m$), the weight $\frac{m}{v + m}$ dominates, pulling the score close to the city-wide average $C$ until sufficient empirical evidence is gathered.
- When a place accumulates substantial reviews ($v \gg m$), the weight $\frac{v}{v + m} \to 1$, allowing the place's true average $R$ to dominate.
- In our test dataset of ~10–12 places and ~26 seed reviews, $m = 5$ provides an ideal balance:
  - A 1-review 5.0 place receives:
    $$W = \left(\frac{1}{1 + 5}\right) \cdot 5.0 + \left(\frac{5}{1 + 5}\right) \cdot 4.0 = 4.17$$
  - A 312-review 4.7 place receives:
    $$W = \left(\frac{312}{312 + 5}\right) \cdot 4.7 + \left(\frac{5}{312 + 5}\right) \cdot 4.0 = 4.69$$
  - The established place with strong evidence ($4.69$) rightfully outranks the unverified newcomer ($4.17$).

### Edge Cases Handled Safely:
1. **Unreviewed places ($v = 0$):** Return `averageRating = null`, `reviewCount = 0`, and `weightedRating = 0` to prevent unreviewed places from floating above established attractions.
2. **Empty database ($C = 0$):** Avoids division-by-zero errors; if no reviews exist in the entire system, weighted score is safely 0.
3. **Calculating $C$ correctly:** $C$ is computed from the complete set of individual reviews rather than an average of place averages, avoiding bias from places with few reviews.

---

## 2. Preventing Overbooking Under High Concurrency

### The Problem
When two travellers click "Book" for the last seats at the exact same millisecond, a standard `read-then-write` application pattern fails:
1. Request A reads remaining seats: 2 available.
2. Request B reads remaining seats: 2 available.
3. Request A inserts 2 seats (total: 10).
4. Request B inserts 2 seats (total: 12).
5. Result: 12 seats booked in a 10-seat slot. One traveller is turned away at the door.

### The Chosen Solution: PostgreSQL Row-Level Locking (`SELECT ... FOR UPDATE`)
We use an **interactive PostgreSQL transaction** with explicit row-level locking on the `tour_slots` row:

1. **Transaction Start**: Begin an interactive Prisma transaction `prisma.$transaction(async (tx) => ...)`.
2. **Pessimistic Row Lock**:
   ```sql
   SELECT "id", "capacity" FROM "tour_slots" WHERE "id" = $1 FOR UPDATE
   ```
   This acquires an exclusive row lock on the target tour slot. Any concurrent transaction attempting to book or inspect the same slot is blocked at the database engine level until this transaction commits or aborts.
3. **Granular Slot Serialization**:
   Locks are held strictly per slot ID. Requests booking *different* tour slots proceed simultaneously in parallel without contention.
4. **Accurate Seat Calculation & Atomic Upsert**:
   - Inside the lock, the transaction reads all existing bookings for that slot and sums the reserved `seats`.
   - If the user already has a booking for this slot, their previous seats are replaced (not accumulated).
   - If `newTotalBookedSeats > capacity`, the transaction immediately aborts with HTTP `409 Conflict`.
   - Otherwise, `booking.upsert` atomically records the reservation and commits.
5. **Database-Level Constraint Protection**:
   The database enforces `UNIQUE (slot_id, user_id)` and `CHECK (seats > 0)`, ensuring data integrity even outside the application boundary.

---

## 3. Backend Architecture & Separation of Concerns

We adopted a modular, layered architecture:

- **`ranking.service.ts`**: Pure mathematical calculations. Contains zero dependencies on Express or Prisma, making it deterministic, lightning fast, and 100% unit-testable.
- **`places.service.ts`**: Handles database retrieval and data transformation.
  - Avoids N+1 query problems by using Prisma's `aggregate` (for $C$) and `groupBy` (for per-place review averages and counts).
  - Selects only needed fields without querying large review text strings.
- **`reviews.service.ts`**: Handles reviews creation and atomic create-or-update behavior (`review.upsert`) using compound unique index `placeId_userId`.
- **`tour-slots.service.ts`**: Retrieves slots in chronological order, calculating availability (`capacity - totalBookedSeats`) in a single query.
- **`bookings.service.ts`**: Encapsulates transactional concurrency control with `SELECT ... FOR UPDATE`.
- **`places.validation.ts` / `reviews.validation.ts` / `bookings.validation.ts`**: Strict runtime schema validation using Zod. Rejects unsupported sort parameters or malformed numbers with HTTP 400.
- **`current-user.middleware.ts`**: Extracts `X-User-Id`, verifies user existence, and prevents body spoofing.
- **`error.middleware.ts`**: Centralized operational error handling that protects against database error leaks in responses.
- **`app.ts` vs `server.ts`**: Express configuration is completely decoupled from port binding, allowing fast in-memory HTTP integration tests via Supertest without opening real network ports.

---

## 4. What We Would Do With More Time

1. **Caching / Materialized Views for Global Average ($C$)**:
   - In high-throughput production environments, computing `AVG(rating)` on millions of reviews on every request can be cached with a short TTL (e.g., 5 minutes) or computed incrementally via Redis/Postgres triggers.
2. **Pagination / Infinite Scroll**:
   - Add cursor-based pagination (`limit`, `cursor`) for scalability as the place catalogue grows.
3. **Waitlists & Real-Time Seat Updates**:
   - Implement WebSockets / Server-Sent Events (SSE) so users see live seat counts update in real-time, and provide an automated waitlist when a slot is full.
4. **Idempotency Keys**:
   - Accept an `Idempotency-Key` header on booking requests to prevent duplicate submissions caused by network timeouts or aggressive double-clicking.
