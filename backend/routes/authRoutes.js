import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);
router.patch(
  "/me",
  authMiddleware,
  roleMiddleware("candidate"),
  updateProfile,
);
export default router;
