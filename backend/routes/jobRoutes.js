import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { createJob, getJobById, getJobs } from "../controllers/jobController.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("recruiter"), createJob);
router.get("/", getJobs);
router.get("/:id",getJobById)

export default router;
