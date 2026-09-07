import bcrypt from "bcrypt";
import User from "../models/User.js";

async function registerUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        msg: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({
        msg: "User already exists",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    return res.status(201).json({
      msg: "User created successfully",
      userId: newUser._id,
    });
  } catch (err) {
    return res.status(500).json({
      msg: "Server error during registration",
    });
  }
}

export default registerUser;
