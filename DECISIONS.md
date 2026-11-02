# Architectural & Engineering Decisions — Wayfarer

This document details key engineering decisions made for the Wayfarer application, explaining why specific solutions were chosen, their mathematical backing, and how they solve the problem.

---

## 1. Honest Ranking: Bayesian Weighted Rating

### The Problem
Simple arithmetic averages (`sum(ratings) / count`) are misleading on platforms with sparse or uneven review counts. 
For example:
- A brand-new café with a single 5-star review (average: 5.0, reviews: 1) would rank higher than an established museum with 312 reviews averaging 4.7.
- A single biased review (positive or negative) can distort a place's position when traffic is low.

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

## 2. Backend Architecture & Separation of Concerns

We adopted a modular, layered architecture:

- **`ranking.service.ts`**: Pure mathematical calculations. Contains zero dependencies on Express or Prisma, making it deterministic, lightning fast, and 100% unit-testable.
- **`places.service.ts`**: Handles database retrieval and data transformation.
  - Avoids N+1 query problems by using Prisma's `aggregate` (for $C$) and `groupBy` (for per-place review averages and counts).
  - Selects only needed fields without querying large review text strings.
- **`places.controller.ts`**: HTTP boundary handling request parsing and response formatting.
- **`places.validation.ts`**: Strict runtime schema validation using Zod. Rejects unsupported sort parameters or malformed categories with HTTP 400.
- **`error.middleware.ts`**: Centralized operational error handling that protects against database error leaks in responses.
- **`app.ts` vs `server.ts`**: Express configuration is completely decoupled from port binding, allowing fast in-memory HTTP integration tests via Supertest without opening real network ports.

---

## 3. What We Would Do With More Time

1. **Caching / Materialized Views for Global Average ($C$)**:
   - In high-throughput production environments, computing `AVG(rating)` on millions of reviews on every request can be cached with a short TTL (e.g., 5 minutes) or computed incrementally via Redis/Postgres triggers.
2. **Pagination / Infinite Scroll**:
   - Add cursor-based pagination (`limit`, `cursor`) for scalability as the place catalogue grows.
3. **Tour Booking Concurrency Protection**:
   - Use PostgreSQL row-level locks (`SELECT ... FOR UPDATE` or serializable transactions) to ensure tour slot capacity is never overbooked during concurrent race conditions.

