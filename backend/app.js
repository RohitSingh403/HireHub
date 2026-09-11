import express from "express";
import cors from "cors";

import router from "./routes/authRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import companyRouter from "./routes/companyRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import candidateApplicationRouter from "./routes/candidateApplicationRoutes.js";
import applicationStatusRouter from "./routes/applicationStatusRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

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
app.use("/api/applications", candidateApplicationRouter);
app.use("/api/applications", applicationStatusRouter);
app.use(errorMiddleware);

export default app;
