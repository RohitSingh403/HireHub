import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getCompanies,
  getJobs,
  getStats,
  getUsers,
  updateJobStatus,
  updateUserRole,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.patch("/users/:id", updateUserRole);
router.get("/jobs", getJobs);
router.patch("/jobs/:id", updateJobStatus);
router.get("/companies", getCompanies);

export default router;
