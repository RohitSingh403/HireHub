import express from "express";
import roleMiddleware from "../middleware/roleMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.get(
  "/candidate",
  authMiddleware,
  roleMiddleware("candidate"),
  function (req, res) {
    res.status(200).json({
      msg: "Candidate access granted",
    });
  },
);

export default router;
