import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

async function registerUser(req, res, next) {
  try {
    const { password, role } = req.body;
    const name = String(req.body.name ?? "").trim();
    const email = normalizeEmail(req.body.email);

    if (role !== "candidate" && role !== "recruiter") {
      return res.status(400).json({
        msg: "Invalid role",
      });
    }

    if (!name) {
      return res.status(400).json({
        msg: "Name is required",
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password are required",
      });
    }

    const existingUser = await User.findOne(emailQuery(email));

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
    const email = normalizeEmail(req.body.email);
    const { password, role } = req.body;

    if (!email || typeof password !== "string" || password.length === 0) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    const user = await User.findOne(emailQuery(email)).select("+password");
    if (!user) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    if (role !== user.role) {
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
      { expiresIn: "7d" },
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

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    skills: user.skills || [],
    yearsOfExperience: user.yearsOfExperience ?? 0,
    preferredRole: user.preferredRole || "",
    location: user.location || "",
    workMode: user.workMode || "",
    salaryMin: user.salaryMin ?? null,
    salaryMax: user.salaryMax ?? null,
  };
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
    return res.json(publicUser(existUser));
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const skills = Array.isArray(req.body.skills)
      ? req.body.skills.map((skill) => String(skill).trim()).filter(Boolean)
      : [];
    const years = Number(req.body.yearsOfExperience);
    const salaryMin = Number(req.body.salaryMin);
    const salaryMax = Number(req.body.salaryMax);
    const workModes = ["remote", "hybrid", "onsite"];
    const location = String(req.body.location ?? "").trim();
    const preferredRole = String(req.body.preferredRole ?? "").trim();

    if (skills.length === 0) {
      return res.status(400).json({
        msg: "Add at least one skill",
      });
    }
    if (!Number.isFinite(years) || years < 0) {
      return res.status(400).json({
        msg: "Years of experience cannot be negative",
      });
    }
    if (!workModes.includes(req.body.workMode)) {
      return res.status(400).json({
        msg: "Invalid work mode",
      });
    }
    if (!location) {
      return res.status(400).json({
        msg: "Location is required",
      });
    }
    if (
      !Number.isFinite(salaryMin) ||
      salaryMin < 0 ||
      !Number.isFinite(salaryMax) ||
      salaryMax < salaryMin
    ) {
      return res.status(400).json({
        msg: "Salary range is invalid",
      });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      {
        skills,
        yearsOfExperience: years,
        preferredRole,
        location,
        workMode: req.body.workMode,
        salaryMin,
        salaryMax,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updated) {
      return res.status(404).json({
        error: "User Not Found",
      });
    }

    return res.status(200).json({
      msg: "Profile updated",
      user: publicUser(updated),
    });
  } catch (err) {
    next(err);
  }
}

export { registerUser, loginUser, getCurrentUser, updateProfile };
