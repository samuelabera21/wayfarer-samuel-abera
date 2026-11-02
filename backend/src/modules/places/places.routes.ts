import { Router } from "express";
import { getPlacesHandler } from "./places.controller.js";
import reviewsRouter from "../reviews/reviews.routes.js";
import { placeTourSlotsRouter } from "../tour-slots/tour-slots.routes.js";

const router = Router();

router.get("/", getPlacesHandler);
router.use("/:placeId/reviews", reviewsRouter);
router.use("/:placeId/tour-slots", placeTourSlotsRouter);

export default router;
