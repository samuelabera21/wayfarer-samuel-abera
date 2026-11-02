import { Router } from "express";
import { getPlacesHandler } from "./places.controller.js";

const router = Router();

router.get("/", getPlacesHandler);

export default router;

