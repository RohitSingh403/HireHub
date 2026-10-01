import Company from "../models/Company.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { scoreMatch } from "../services/match.js";
import {
  isJobCursor,
  isRankCursor,
  jobCursor,
  pageRanked,
  readPage,
  withJobCursor,
} from "../services/pagination.js";

const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"];
const WORK_MODES = ["remote", "hybrid", "onsite"];
const JOB_STATUSES = ["open", "closed", "draft"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function queryValue(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null) {
    return "";
  }
  return String(raw).trim();
}

function parsedExperienceMin(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return null;
  }
  return number;
}

function isJobOwner(job, user) {
  if (!user?.userId || !job?.createdBy) {
    return false;
  }
  return job.createdBy.toString() === String(user.userId);
}

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
      salaryMin === undefined ||
      salaryMin === null ||
      salaryMin === "" ||
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

    if (
      req.body.status !== undefined &&
      !JOB_STATUSES.includes(req.body.status)
    ) {
      return res.status(400).json({
        msg: "Invalid job status",
      });
    }

    if (
      req.body.experienceMin !== undefined &&
      req.body.experienceMin !== "" &&
      parsedExperienceMin(req.body.experienceMin) === null
    ) {
      return res.status(400).json({
        msg: "Minimum years cannot be negative",
      });
    }

    const experienceMin = parsedExperienceMin(req.body.experienceMin);
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
      ...(experienceMin === undefined || experienceMin === null
        ? {}
        : { experienceMin }),
      ...(JOB_STATUSES.includes(req.body.status) ? { status: req.body.status } : {}),
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
    const keyword = queryValue(req.query.keyword);
    const location = queryValue(req.query.location);
    const employmentType = queryValue(req.query.employmentType);
    const workMode = queryValue(req.query.workMode);
    const filter = { status: "open" };

    if (employmentType) {
      if (!EMPLOYMENT_TYPES.includes(employmentType)) {
        return res.status(400).json({
          msg: "Invalid employment type",
        });
      }
      filter.employmentType = employmentType;
    }

    if (workMode) {
      if (!WORK_MODES.includes(workMode)) {
        return res.status(400).json({
          msg: "Invalid work mode",
        });
      }
      filter.workMode = workMode;
    }

    if (location) {
      filter.location = { $regex: escapeRegex(location), $options: "i" };
    }

    if (keyword) {
      const pattern = () => ({ $regex: escapeRegex(keyword), $options: "i" });
      filter.$or = [
        { title: pattern() },
        { description: pattern() },
        { skills: pattern() },
        { location: pattern() },
      ];
    }

    const page = readPage(req.query);
    if (page.error) {
      return res.status(400).json({ msg: page.error });
    }
    if (!isJobCursor(page.cursor)) {
      return res.status(400).json({ msg: "Invalid cursor" });
    }

    const found = await Job.find(withJobCursor(filter, page.cursor))
      .populate("company", "name logo location")
      .sort({ createdAt: -1, _id: -1 })
      .limit(page.limit + 1);

    const allJobs = found.slice(0, page.limit);

    return res.status(200).json({
      msg: "All jobs",
      allJobs,
      nextCursor: found.length > page.limit ? jobCursor(allJobs.at(-1)) : null,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyJobs(req, res, next) {
  try {
    const jobs = await Job.find({ createdBy: req.user.userId })
      .populate("company", "name logo location")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      msg: "Your jobs",
      jobs,
    });
  } catch (err) {
    next(err);
  }
}

async function getJobById(req, res, next) {
  try {
    const findJob = await Job.findById(req.params.id).populate(
      "company",
      "name logo location industry website description",
    );

    if (!findJob) {
      return res.status(404).json({
        msg: "Job not found",
      });
    }

    if (findJob.status !== "open" && !isJobOwner(findJob, req.user)) {
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

    if (
      req.body.experienceMin !== undefined &&
      req.body.experienceMin !== ""
    ) {
      const experienceMin = parsedExperienceMin(req.body.experienceMin);
      if (experienceMin === null) {
        return res.status(400).json({
          msg: "Minimum years cannot be negative",
        });
      }
      updateJobData.experienceMin = experienceMin;
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
      returnDocument: "after",
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

async function getRecommendedJobs(req, res, next) {
  try {
    const profile = await User.findById(req.user.userId);
    if (!profile) {
      return res.status(404).json({
        error: "User Not Found",
      });
    }

    const page = readPage(req.query);
    if (page.error) {
      return res.status(400).json({ msg: page.error });
    }
    if (!isRankCursor(page.cursor)) {
      return res.status(400).json({ msg: "Invalid cursor" });
    }

    const openJobs = await Job.find({ status: "open" })
      .populate("company", "name logo location")
      .sort({ createdAt: -1 });

    const ranked = openJobs
      .map((job) => {
        const match = scoreMatch(profile, job);
        if (!match) {
          return null;
        }
        return { job, match };
      })
      .filter(Boolean)
      .sort((left, right) => compareRank(rankKey(left), rankKey(right)));

    const { page: jobs, nextCursor } = pageRanked(
      ranked,
      page.limit,
      page.cursor,
      rankKey,
    );

    return res.status(200).json({
      msg: "Recommended jobs",
      jobs,
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
}

function rankKey(item) {
  return {
    overall: item.match.overall,
    label: String(item.job.title),
    id: String(item.job._id),
  };
}

function compareRank(left, right) {
  if (right.overall !== left.overall) {
    return right.overall - left.overall;
  }
  const byLabel = left.label.localeCompare(right.label);
  if (byLabel !== 0) {
    return byLabel;
  }
  return left.id.localeCompare(right.id);
}

export {
  createJob,
  getJobs,
  getMyJobs,
  getRecommendedJobs,
  getJobById,
  updateJob,
  deleteJob,
};
