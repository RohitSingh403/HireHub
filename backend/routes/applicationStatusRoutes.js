import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { updateApplicationStatus } from "../controllers/applicationController.js";

const router = express.Router();

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("recruiter"),
  updateApplicationStatus,
);

export default router;
