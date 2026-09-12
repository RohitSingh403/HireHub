import Company from "../models/Company.js";
import Job from "../models/Job.js";

async function createJob(req, res, next) {
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

    const existCompany = await Company.findById(company);

    if (!existCompany) {
      return res.status(404).json({
        msg: "Company not found",
      });
    }

    if (existCompany.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        msg: "Access forbidden",
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
    next(err);
  }
}

async function getJobs(req, res, next) {
  try {
    const allJobs = await Job.find();
    return res.status(200).json({
      msg: "All jobs",
      allJobs: allJobs,
    });
  } catch (err) {
    next(err);
  }
}

async function getJobById(req, res, next) {
  try {
    const findJob = await Job.findById(req.params.id);

    if (!findJob) {
      return res.status(404).json({
        msg: "Job not found",
      });
    }

    return res.status(200).json({
      msg: "Job successfully found",
      job: findJob,
    });
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const getJobId = req.params.id;

    const getJobFromDb = await Job.findById(getJobId);

    if (!getJobFromDb) {
      return res.status(404).json({
        msg: "Job not found",
      });
    }

    if (getJobFromDb.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        msg: "Access forbidden",
      });
    }

    const updateJobData = {};

    if (req.body.title !== undefined) {
      updateJobData.title = req.body.title;
    }

    if (req.body.description !== undefined) {
      updateJobData.description = req.body.description;
    }

    if (req.body.location !== undefined) {
      updateJobData.location = req.body.location;
    }

    if (req.body.employmentType !== undefined) {
      updateJobData.employmentType = req.body.employmentType;
    }

    if (req.body.workMode !== undefined) {
      updateJobData.workMode = req.body.workMode;
    }

    if (req.body.salaryMin !== undefined) {
      updateJobData.salaryMin = req.body.salaryMin;
    }

    if (req.body.salaryMax !== undefined) {
      updateJobData.salaryMax = req.body.salaryMax;
    }

    if (req.body.skills !== undefined) {
      updateJobData.skills = req.body.skills;
    }

    if (req.body.experience !== undefined) {
      updateJobData.experience = req.body.experience;
    }

    if (req.body.status !== undefined) {
      updateJobData.status = req.body.status;
    }

    if (Object.keys(updateJobData).length === 0) {
      return res.status(400).json({
        msg: "At least one field is required for update",
      });
    }

    const patchJob = await Job.findByIdAndUpdate(getJobId, updateJobData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      msg: "Job Updated Successfully",
      job: patchJob,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const getJobId = req.params.id;
    const findJobFromDb = await Job.findById(getJobId);
    if (!findJobFromDb) {
      return res.status(404).json({
        msg: "Job not found",
      });
    }
    if (findJobFromDb.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        msg: "Access forbidden",
      });
    }

    await Job.findByIdAndDelete(getJobId);

    return res.status(200).json({
      msg: "Job deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}

export { createJob, getJobs, getJobById, updateJob, deleteJob };
