import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import applyForJob from "../controllers/applicationController.js";

const router = express.Router();

router.post("/:jobId/apply", authMiddleware, roleMiddleware("candidate"), applyForJob);

export default router;
