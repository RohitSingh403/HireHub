import express from "express";
import cors from "cors";

import router from "./routes/authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", function (req, res) {
  res.status(200).json({
    success: true,
    msg: "HireHub API is running",
  });
});

app.use("/api/auth", router);

export default app;
