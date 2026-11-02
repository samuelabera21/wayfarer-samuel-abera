import { Router } from "express";
import { getPlacesHandler } from "./places.controller.js";
import reviewsRouter from "../reviews/reviews.routes.js";

const router = Router();

router.get("/", getPlacesHandler);
router.use("/:placeId/reviews", reviewsRouter);

export default router;
