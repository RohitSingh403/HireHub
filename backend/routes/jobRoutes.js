import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuthMiddleware from "../middleware/optionalAuthMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  getMyJobs,
  getRecommendedJobs,
  updateJob,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("recruiter"), createJob);
router.get(
  "/mine",
  authMiddleware,
  roleMiddleware("recruiter"),
  getMyJobs,
);
router.get(
  "/recommended",
  authMiddleware,
  roleMiddleware("candidate"),
  getRecommendedJobs,
);
router.get("/", optionalAuthMiddleware, getJobs);
router.get("/:id", optionalAuthMiddleware, getJobById);
router.patch("/:id", authMiddleware, roleMiddleware("recruiter"), updateJob);
router.delete("/:id", authMiddleware, roleMiddleware("recruiter"), deleteJob);

export default router;
