import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

const startServer = async function () {
  await connectDB();
  app.listen(process.env.PORT, function () {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
};
startServer();
