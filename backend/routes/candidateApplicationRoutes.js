import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getMyApplication,
  getMyApplications,
} from "../controllers/applicationController.js";

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  roleMiddleware("candidate"),
  getMyApplications,
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("candidate"),
  getMyApplication,
);

export default router;
