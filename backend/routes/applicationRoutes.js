import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  applyForJob,
  getJobApplications,
} from "../controllers/applicationController.js";

const router = express.Router();

router.post(
  "/:jobId/apply",
  authMiddleware,
  roleMiddleware("candidate"),
  applyForJob,
);

router.get(
  "/:jobId/applications",
  authMiddleware,
  roleMiddleware("recruiter"),
  getJobApplications,
);

export default router;
