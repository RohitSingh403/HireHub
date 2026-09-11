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

async function getMyApplications(req, res) {
  const userId = req.user.userId;
  const findApplication = await Application.find({
    candidate: userId,
  });
  return res.status(200).json({
    msg: "Applications successfully found",
    applications: findApplication,
  });
}

async function getJobApplications(req, res) {
  const jobId = req.params.jobId;
  const userId = req.user.userId;

  const jobExist = await Job.findById(jobId);
  if (!jobExist) {
    return res.status(404).json({
      msg: "Job not found",
    });
  }

  if (jobExist.createdBy.toString() !== userId) {
    return res.status(403).json({
      msg: "Access forbidden",
    });
  }

  const applications = await Application.find({
    job: jobId,
  });

  return res.status(200).json({
    msg: "Job applications successfully found",
    applications: applications,
  });
}

async function updateApplicationStatus(req, res) {
  const applicationId = req.params.id;
  const recruiterId = req.user.userId;

  const applicationExist = await Application.findById(applicationId);

  if (!applicationExist) {
    return res.status(404).json({
      msg: " Application not found",
    });
  }

  const jobExist = await Job.findById(applicationExist.job);

  if (!jobExist) {
    return res.status(404).json({
      msg: "Job not found",
    });
  }

  if (jobExist.createdBy.toString() !== recruiterId) {
    return res.status(403).json({
      msg: "Access denied",
    });
  }

  const { status } = req.body;

  const allowedStatus = ["applied", "shortlisted", "rejected", "hired"];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({
      msg: "Please input a valid status",
    });
  }

  await Application.updateOne(
    {
      _id: applicationId,
    },
    {
      status: status,
    },
  );

  return res.status(200).json({
    msg: "Application status updated successfully",
  });
}

export {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
};
