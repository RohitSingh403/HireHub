import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "An application must belong to a candidate"],
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "An application must be linked to a specific job"],
    },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "hired"],
      default: "applied",
    },
  },
  {
    timestamps: true,
  },
);

const Application = mongoose.model("Application", applicationSchema);
export default Application;
