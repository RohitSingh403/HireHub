import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createCompany,
  getCompanyById,
  updateCompany,
} from "../controllers/companyController.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("recruiter"), createCompany);
router.get("/:id", getCompanyById);
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("recruiter"),
  updateCompany,
);

export default router;
