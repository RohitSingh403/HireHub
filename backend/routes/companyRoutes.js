import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import createCompany from "../controllers/companyController.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("recruiter"), createCompany);

export default router;
