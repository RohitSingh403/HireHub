import Job from "../models/Job.js";
import Application from "../models/Application.js";

async function applyForJob(req, res) {
  const candidateId = req.user.userId;
  const jobId = req.params.jobId;

  const jobExist = await Job.findById(jobId);
  if (!jobExist) {
    return res.status(404).json({
      msg: "Job not found",
    });
  }

  if (jobExist.status !== "open") {
    return res.status(400).json({
      msg: "Job is not open for applications",
    });
  }
  const existingApplication = await Application.findOne({
    candidate: candidateId,
    job: jobId,
  });

  if (existingApplication) {
    return res.status(409).json({
      msg: "You have already applied for this job",
    });
  }

  const newApplication = await Application.create({
    candidate: candidateId,
    job: jobId,
  });

  return res.status(201).json({
    msg: "Application created successfully",
    application: newApplication,
  });
}

export default applyForJob;
