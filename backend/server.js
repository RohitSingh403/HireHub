import dotenv from "dotenv";
import connectDB from "./config/db.js";
import ensureAdmin from "./services/ensureAdmin.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5001

const startServer = async function () {
  try {
    await connectDB();
    await ensureAdmin();
  } catch {
    console.error("Could not start the API");
    process.exit(1);
  }

  app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
  });
};
startServer();
