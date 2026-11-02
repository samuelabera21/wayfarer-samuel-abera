import express from "express";
import cors from "cors";
import placesRouter from "./modules/places/places.routes.js";
import { directTourSlotsRouter } from "./modules/tour-slots/tour-slots.routes.js";
import usersRouter from "./modules/users/users.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Wayfarer API is running",
  });
});

// Feature routes
app.use("/api/places", placesRouter);
app.use("/api/tour-slots", directTourSlotsRouter);
app.use("/api/users", usersRouter);

// Global error handling middleware (must be after routes)
app.use(errorHandler);

export default app;
