import Job from "../models/Job.js";

async function createJob(req, res) {
  try {
    const {
      title,
      description,
      company,
      location,
      employmentType,
      workMode,
      salaryMin,
      salaryMax,
      skills,
      experience,
    } = req.body;

    if (
      !title ||
      !description ||
      !company ||
      !location ||
      !employmentType ||
      !workMode ||
      !salaryMin ||
      !skills ||
      !experience
    ) {
      return res.status(400).json({
        msg: "All fields are required",
      });
    }
    const newJob = await Job.create({
      title,
      description,
      company,
      location,
      employmentType,
      workMode,
      salaryMin,
      salaryMax,
      skills,
      experience,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      msg: "Job created successfully",
      job: newJob,
    });
  } catch (err) {
    return res.status(500).json({
      err: "Internal Server error",
    });
  }
}

export default createJob;

