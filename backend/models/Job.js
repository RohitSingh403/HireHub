import mongoose from "mongoose";
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "A job must be linked to  a company profile"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    employmentType: {
      type: String,
      required: [true, "Employment type is required"],
      enum: ["full-time", "part-time", "contract", "internship", "remote-only"],
      default: "full-time",
    },
    workMode: {
      type: String,
      required: [true, "Work mode is required"],
      enum: ["remote", "hybrid", "onsite"],
      default: "onsite",
    },
    salaryMin: {
      type: Number,
      required: [true, "Minimum salary is required"],
      min: [0, "Salary cannot be negative"],
    },
    salaryMax: {
      type: Number,
      required: [true, "Maximum salary is required"],
      validate: {
        validator: function (value) {
          return value >= this.salaryMin;
        },
        message:
          "Maximum salary must be greater than or equal to minimum salary",
      },
    },
    skills: {
      type: [String],
      required: [true, "At least one skill is required"],
      validate: {
        validator: function (skillsArray) {
          return skillsArray && skillsArray.length > 0;
        },
        message: "At least one skill is required",
      },
    },
    experience: {
      type: String,
      required: [true, "Experience level is required"],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A job must be linked to a creator/recruiter"],
    },
    status: {
      type: String,
      enum: ["open", "closed", "draft"],
      default: "open",
    },
  },
  {
    timestamps: true,
  },
);

jobSchema.index({
  title: "text",
  skills: "text",
});

const Job = mongoose.model("Job", jobSchema);

export default Job;
