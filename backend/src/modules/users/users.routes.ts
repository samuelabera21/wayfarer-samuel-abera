import { Router } from "express";
import { getUsersHandler } from "./users.controller.js";

const router = Router();

router.get("/", getUsersHandler);

export default router;

