import { Router } from "express";
import {
  getPlaceTourSlotsHandler,
  getTourSlotByIdHandler,
} from "./tour-slots.controller.js";
import bookingsRouter from "../bookings/bookings.routes.js";

// Sub-router mounted under /api/places/:placeId/tour-slots
export const placeTourSlotsRouter = Router({ mergeParams: true });
placeTourSlotsRouter.get("/", getPlaceTourSlotsHandler);

// Top-level router mounted under /api/tour-slots
export const directTourSlotsRouter = Router();
directTourSlotsRouter.get("/:slotId", getTourSlotByIdHandler);
directTourSlotsRouter.use("/:slotId/bookings", bookingsRouter);

export default placeTourSlotsRouter;
