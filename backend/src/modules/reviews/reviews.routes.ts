import { Router } from "express";
import { currentUserMiddleware } from "../../middleware/current-user.middleware.js";
import {
  createOrUpdateReviewHandler,
  getPlaceReviewsHandler,
} from "./reviews.controller.js";

const router = Router({ mergeParams: true });

router.post("/", currentUserMiddleware, createOrUpdateReviewHandler);
router.get("/", getPlaceReviewsHandler);

export default router;

