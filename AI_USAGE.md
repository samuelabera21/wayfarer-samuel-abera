# AI Usage & Development Disclosure — Wayfarer

> AI tools were used as engineering assistants throughout the development of Wayfarer. I established the project foundation and technical direction first, then used AI to assist with planning, implementation, and code verification.

---

## 1. Tools Used

- **ChatGPT:** Used for architectural discussions, evaluating technical trade-offs, and clarifying engineering concepts.
- **Google Antigravity with Gemini Pro:** Used as an AI development environment to write code, generate tests, and refine frontend and backend components.

---

## 2. Development Workflow

I used a structured, human-directed development process:

1. **Foundation & Architecture:** Selected the stack (Next.js, Express, PostgreSQL, Prisma), designed the database tables, and defined the project structure.
2. **Technical Discussion:** Used ChatGPT to review design decisions and identify potential edge cases.
3. **Guided Implementation:** Assigned tasks incrementally to Antigravity, requiring it to follow established patterns and explain changes before making them.
4. **Testing & Review:** Inspected generated code and verified every feature using automated tests and manual testing in the browser.

---

## 3. Example Prompts & What I Did With the Answers

The following examples represent the types of prompts I used during development. They are representative examples, not necessarily exact transcripts.

### Example 1 — Architecture review and planning
> *"Review the project requirements and my proposed architecture, database design, and folder structure. Evaluate whether they follow reasonable software engineering practices. Identify potential problems, explain the trade-offs, and suggest improvements where necessary. Avoid unnecessary complexity, and explain the reasons before recommending significant changes."*

**What I did with the answer:**  
I evaluated the AI's feedback on my database design, adopted its recommendation to add `@@unique([placeId, userId])` to enforce one review per user at the database level, but kept the scope focused on Debre Berhan without adding unnecessary multi-city complexity.

---

### Example 2 — Guided feature implementation
> *"Before implementing this feature, inspect the existing project structure, architecture references, database design, and development guidelines. Follow the established conventions and reuse existing components where appropriate. Implement the feature incrementally. If you identify a design problem or a better approach, explain it before making significant changes. After implementation, report what was changed and how it was verified."*

**What I did with the answer:**  
I reviewed the incremental implementation of the booking transaction, verified that the `SELECT ... FOR UPDATE` row lock was acquired before checking seat availability, and ran the unit test suite to verify that concurrency conflicts return `HTTP 409`.

---

## 4. One Time the AI Was Wrong & What I Did

### What the AI did wrong:
When implementing the Bayesian ranking formula, the AI initially calculated the baseline rating $C$ using the raw average of all reviews in the database (`SELECT AVG(rating)`). Because my early test data was mostly 4 and 5-star reviews, the database average was around 4.6. This made the baseline too high, so a new place with just 1 review (5.0 ★) still outranked an established church with 3 reviews.

### How I noticed:
I switched the sort dropdown to **"Top rated"** in the browser and saw that *Debre Berhan Wool Factory* (1 review) was scoring 4.68, undeservedly beating *Debre Birhan Silase Church* (3 reviews, avg 4.67) at 4.63.

### What I did instead:
I manually calculated the scores and realized the baseline needed a realistic ceiling. I updated the backend in `places.service.ts` to cap the baseline at `4.0` (a normal 80% benchmark). This pulled the 1-review place down to **4.17**, allowing the established 3-review church (**4.25**) to rightfully take the top spot.

---

## 5. Verification Checklist

To ensure code quality and ownership, all implementations were verified by:
- Running all automated unit tests (`npm run test:unit`) — 36 passing.
- Running linter checks (`npm run lint`) — 0 errors, 0 warnings.
- Testing race conditions with simulated concurrent requests.
- Manually verifying booking capacity, filtering, sorting, and user switching in the UI.
