# Architectural & Technical Decisions — Wayfarer

---

## 1. Honest Ranking: Bayesian Weighted Rating

### Problem
Arithmetic averages (`sum / count`) reward unproven entities: an attraction with a single 5-star review ($R = 5.0, v = 1$) naively outranks an established landmark with multiple reviews averaging 4.7.

### Solution
I calculate an empirical Bayesian Weighted Rating ($W$) based on IMDB’s formula:

$$W = \left(\frac{v}{v + m}\right) \cdot R + \left(\frac{m}{v + m}\right) \cdot C$$

- **$R$**: Arithmetic mean rating of the place.
- **$v$**: Number of reviews for that place.
- **$m = 5$**: Prior confidence weight (assumes 5 baseline observations).
- **$C = 4.0$**: Global benchmark prior (capped to prevent skewed priors from inflating newcomer scores).

### Step-by-Step Proof Using Seeded Data

1. **Debre Birhan Silase Church** (Established: 3 reviews — 5★, 5★, 4★):
   - $v = 3$, $R = \frac{14}{3} \approx 4.67$, $m = 5$, $C = 4.0$
   $$W = \left(\frac{3}{3 + 5}\right) \cdot 4.67 + \left(\frac{5}{3 + 5}\right) \cdot 4.0 = \left(\frac{3}{8} \cdot 4.67\right) + \left(\frac{5}{8} \cdot 4.0\right) = 1.75 + 2.50 = \mathbf{4.25}$$

2. **Debre Berhan Wool Factory** (Newcomer: 1 review — 5★):
   - $v = 1$, $R = 5.0$, $m = 5$, $C = 4.0$
   $$W = \left(\frac{1}{1 + 5}\right) \cdot 5.0 + \left(\frac{5}{1 + 5}\right) \cdot 4.0 = \left(\frac{1}{6} \cdot 5.0\right) + \left(\frac{5}{6} \cdot 4.0\right) = 0.83 + 3.33 = \mathbf{4.17}$$

**Outcome:** Under naive sorting, Wool Factory ($5.0\star$) unfairly beats Silase Church ($4.67\star$). Under Bayesian ranking, **Silase Church ($\mathbf{4.25}$) rightfully outranks Wool Factory ($\mathbf{4.17}$)** because 3 consistent community reviews provide greater statistical confidence than a single unverified rating.

---

## 2. Preventing Tour Overbooking

### Problem
If two travellers click "Book" on the last seat at the exact same moment, both requests might see 1 seat remaining before either finishes saving. This would confirm both bookings and overbook the tour.

### Solution: Row Locking (`SELECT ... FOR UPDATE`)
I handle the booking inside a database transaction with a row lock:

1. **Lock the Tour Slot:** Using `SELECT ... FOR UPDATE`, the database temporarily locks that specific tour slot while the booking is processed.
2. **Check Remaining Seats:** The available capacity is checked while the row is locked.
3. **Accept or Reject:**
   - If seats are available, the booking is saved and the transaction finishes.
   - If no seats are left, the transaction stops and returns a `409 Conflict` error.
4. **Friendly UI:** The frontend catches the 409 error and immediately marks the tour as `Fully booked` so the traveller clearly knows the seat was just taken.

---

## 3. Key Engineering Decisions Beyond Requirements

- **Self-Hosted Assets Over External CDNs:** Place images are served as local static assets (`/places/...`) rather than remote URLs. This eliminates external network dependencies, prevents CDN rate-limits/broken hotlinks, and ensures 100% offline evaluation predictability.
- **Deterministic 3-Tier Sort Order:** Places are sorted by `weightedRating DESC` $\rightarrow$ `reviewCount DESC` $\rightarrow$ `id ASC`. This prevents UI card shuffling and unstable pagination when multiple destinations share identical ratings.
- **One-Review-Per-User Upsert:** The schema enforces `@@unique([placeId, userId])`. Submitting a new rating updates the existing review in-place rather than creating duplicates or skewing Bayesian evidence counts.
- **Decoupled Identity Context:** The user switcher passes `X-User-Id` through an Axios interceptor into Express middleware. This keeps the core business logic stateless and ready for standard token authentication (JWT/OAuth2) with zero controller changes.

---

## 4. What I Would Do With More Time

1. **Booking Cancellation & Seat Release:** Implement a cancellation workflow that atomically releases reserved seats back to the tour slot's available capacity.
2. **Redis Caching / Materialized Views for $C$:** Cache global rating aggregates with short TTLs or incremental Postgres triggers to eliminate repeated table scans at scale.
3. **Real-Time Push (Server-Sent Events / WebSockets):** Broadcast remaining capacity changes so open browser tabs reflect decrements live without manual refresh.
4. **FIFO Waitlist Engine:** Allow travellers to join a queue for fully-booked tours, automatically claiming seats upon cancellations.
