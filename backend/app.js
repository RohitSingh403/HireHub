// const express = require("express");
// const app = express();

// const cors = require("cors");
// app.use(cors());
// app.use(express.json());

// app.get("/api/health", function (req, res) {
//   res.status(200).json({
//     success: true,
//     msg: "HireHub API is running",
//   });
// });

// module.exports = app;
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", function (req, res) {
  res.status(200).json({
    success: true,
    msg: "HireHub API is running",
  });
});

export default app;