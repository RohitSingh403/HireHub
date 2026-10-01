import Application from "../models/Application.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import {
  isJobCursor,
  jobCursor,
  readPage,
  withJobCursor,
} from "../services/pagination.js";
import { APPLICATION_STATUSES } from "../services/pipeline.js";

const ASSIGNABLE_ROLES = ["candidate", "recruiter"];
const USER_ROLES = ["candidate", "recruiter", "admin"];
const JOB_STATUSES = ["open", "closed"];
const ALL_JOB_STATUSES = ["open", "closed", "draft"];

function sameId(left, right) {
  return String(left) === String(right);
}

function readPageOrRespond(req, res) {
  const page = readPage(req.query);
  if (page.error) {
    res.status(400).json({ msg: page.error });
    return null;
  }
  if (!isJobCursor(page.cursor)) {
    res.status(400).json({ msg: "Invalid cursor" });
    return null;
  }
  return page;
}

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function pageByCreatedAt(model, filter, page, prepare) {
  let query = model
    .find(withJobCursor(filter, page.cursor))
    .sort({ createdAt: -1, _id: -1 })
    .limit(page.limit + 1);
  if (prepare) {
    query = prepare(query);
  }
  const found = await query;
  const items = found.slice(0, page.limit);
  return {
    items,
    nextCursor: found.length > page.limit ? jobCursor(items.at(-1)) : null,
  };
}

async function countByField(model, field, keys) {
  const rows = await model.aggregate([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const row of rows) {
    if (typeof row._id !== "string") {
      continue;
    }
    counts[row._id] = row.count;
  }
  return counts;
}

async function getStats(req, res, next) {
  try {
    const [usersByRole, companies, jobsByStatus, applicationsByStatus] =
      await Promise.all([
        countByField(User, "role", USER_ROLES),
        Company.countDocuments(),
        countByField(Job, "status", ALL_JOB_STATUSES),
        countByField(Application, "status", APPLICATION_STATUSES),
      ]);

    return res.status(200).json({
      usersByRole,
      companies,
      jobsByStatus,
      applicationsByStatus,
    });
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const page = readPageOrRespond(req, res);
    if (!page) {
      return;
    }

    const { items, nextCursor } = await pageByCreatedAt(User, {}, page, (query) =>
      query.select("name email role createdAt"),
    );

    return res.status(200).json({
      users: items.map(publicUser),
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const role = req.body.role;
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({
        msg: "Role must be candidate or recruiter",
      });
    }

    const user = await User.findById(req.params.id).select(
      "name email role createdAt",
    );
    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    if (sameId(user._id, req.user.userId)) {
      return res.status(403).json({
        msg: "You cannot change your own role",
      });
    }

    const updated = await User.findByIdAndUpdate(
      user._id,
      { role },
      { returnDocument: "after", runValidators: true },
    ).select("name email role createdAt");

    return res.status(200).json({
      msg: "Role updated",
      user: publicUser(updated),
    });
  } catch (err) {
    next(err);
  }
}

async function getJobs(req, res, next) {
  try {
    const page = readPageOrRespond(req, res);
    if (!page) {
      return;
    }

    const { items, nextCursor } = await pageByCreatedAt(Job, {}, page, (query) =>
      query.populate("company", "name location"),
    );

    return res.status(200).json({
      jobs: items,
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
}

async function updateJobStatus(req, res, next) {
  try {
    const status = req.body.status;
    if (!JOB_STATUSES.includes(status)) {
      return res.status(400).json({
        msg: "Status must be open or closed",
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        msg: "Job not found",
      });
    }

    job.status = status;
    await job.save();
    await job.populate("company", "name location");

    return res.status(200).json({
      msg: "Job status updated",
      job,
    });
  } catch (err) {
    next(err);
  }
}

async function getCompanies(req, res, next) {
  try {
    const page = readPageOrRespond(req, res);
    if (!page) {
      return;
    }

    const { items, nextCursor } = await pageByCreatedAt(
      Company,
      {},
      page,
      (query) => query.populate("owner", "name email"),
    );

    return res.status(200).json({
      companies: items,
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
}

export { getStats, getUsers, updateUserRole, getJobs, updateJobStatus, getCompanies };
