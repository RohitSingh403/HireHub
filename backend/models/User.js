import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ["candidate", "recruiter", "admin"],
    },
    skills: {
      type: [String],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      min: [0, "Years of experience cannot be negative"],
      default: 0,
    },
    preferredRole: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    workMode: {
      type: String,
      enum: ["remote", "hybrid", "onsite"],
    },
    salaryMin: {
      type: Number,
      min: [0, "Salary cannot be negative"],
    },
    salaryMax: {
      type: Number,
      min: [0, "Salary cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
export default User;
