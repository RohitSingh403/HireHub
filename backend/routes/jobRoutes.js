import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  updateJob,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("recruiter"), createJob);
router.get("/", getJobs);
router.get("/:id", getJobById);
router.patch("/:id", authMiddleware, roleMiddleware("recruiter"), updateJob);
router.delete("/:id", authMiddleware, roleMiddleware("recruiter"), deleteJob);

export default router;
