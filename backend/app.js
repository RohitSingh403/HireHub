import express from "express";
import cors from "cors";

import router from "./routes/authRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import companyRouter from "./routes/companyRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";

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
app.use("/api/jobs", jobRouter);
app.use("/api/companies", companyRouter);
app.use("/api/jobs", applicationRouter);
export default app;
