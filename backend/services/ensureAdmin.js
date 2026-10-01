import bcrypt from "bcrypt";
import User from "../models/User.js";

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function emailQuery(email) {
  return {
    email: {
      $regex: `^${escapeRegex(email)}$`,
      $options: "i",
    },
  };
}

async function ensureAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;

  if (!email || typeof password !== "string" || password.length === 0) {
    return { created: false };
  }

  const existing = await User.findOne(emailQuery(email));
  if (existing) {
    return { created: false };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await User.create({
      name: "HireHub Admin",
      email,
      password: hashedPassword,
      role: "admin",
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return { created: false };
    }
    throw new Error("Could not create the admin account");
  }

  console.log("Admin account created");
  return { created: true };
}

export default ensureAdmin;
