import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getMyApplications } from "../controllers/applicationController.js";

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  roleMiddleware("candidate"),
  getMyApplications,
);

export default router;
