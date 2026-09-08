import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import createJob from "../controllers/jobController.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("recruiter"), createJob);

export default router;
