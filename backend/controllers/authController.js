import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

async function registerUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (role !== "candidate" && role !== "recruiter") {
      return res.status(400).json({
        msg: "Invalid role",
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password are required",
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
    next(err);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      // { expiresIn: "1h" },
    );

    return res.status(200).json({
      msg: "Login Successfull",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user.userId;

    const existUser = await User.findById(userId);

    if (!existUser) {
      return res.status(404).json({
        error: "User Not Found",
      });
    }
    return res.json({
      id: existUser._id,
      name: existUser.name,
      email: existUser.email,
      role: existUser.role,
    });
  } catch (err) {
    next(err);
  }
}

export { registerUser, loginUser, getCurrentUser };
