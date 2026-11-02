import { Router } from "express";
import { currentUserMiddleware } from "../../middleware/current-user.middleware.js";
import { createOrUpdateBookingHandler } from "./bookings.controller.js";

const router = Router({ mergeParams: true });

router.post("/", currentUserMiddleware, createOrUpdateBookingHandler);

export default router;

