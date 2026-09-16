import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000

const startServer = async function () {
  await connectDB();
  app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
  });
};
startServer();
