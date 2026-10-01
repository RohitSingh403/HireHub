import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { scoreMatch } from "../services/match.js";
import { legalNextStatuses, transitionError } from "../services/pipeline.js";
import { isRankCursor, pageRanked, readPage } from "../services/pagination.js";

async function applyForJob(req, res, next) {
  try {
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
      status: "applied",
      statusHistory: [
        {
          status: "applied",
          actor: candidateId,
          timestamp: new Date(),
        },
      ],
    });

    return res.status(201).json({
      msg: "Application created successfully",
      application: newApplication,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyApplications(req, res, next) {
  try {
    const userId = req.user.userId;
    const findApplication = await Application.find({
      candidate: userId,
    })
      .populate({
        path: "job",
        select:
          "title location employmentType workMode status salaryMin salaryMax company",
        populate: { path: "company", select: "name logo location" },
      })
      .sort({ createdAt: -1 });
    return res.status(200).json({
      msg: "Applications successfully found",
      applications: findApplication,
    });
  } catch (err) {
    next(err);
  }
}

async function getJobApplications(req, res, next) {
  try {
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

    const page = readPage(req.query);
    if (page.error) {
      return res.status(400).json({ msg: page.error });
    }
    if (!isRankCursor(page.cursor)) {
      return res.status(400).json({ msg: "Invalid cursor" });
    }

    const applications = await Application.find({
      job: jobId,
    }).populate(
      "candidate",
      "name email skills yearsOfExperience preferredRole location workMode salaryMin salaryMax",
    );

    const ranked = applications
      .map((application) => {
        const plain = application.toObject();
        return {
          ...plain,
          match: scoreMatch(plain.candidate, jobExist),
          nextStatuses: legalNextStatuses(plain.status),
        };
      })
      .sort((left, right) => compareApplicants(left, right));

    const { page: visible, nextCursor } = pageRanked(
      ranked,
      page.limit,
      page.cursor,
      applicantKey,
    );

    return res.status(200).json({
      msg: "Job applications successfully found",
      applications: visible,
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyApplication(req, res, next) {
  try {
    const application = await Application.findById(req.params.id)
      .populate({
        path: "job",
        select:
          "title location employmentType workMode status salaryMin salaryMax company",
        populate: { path: "company", select: "name logo location" },
      })
      .populate("statusHistory.actor", "name");

    if (!application) {
      return res.status(404).json({
        msg: "Application not found",
      });
    }

    if (application.candidate.toString() !== req.user.userId) {
      return res.status(404).json({
        msg: "Application not found",
      });
    }

    return res.status(200).json({
      msg: "Application successfully found",
      application,
    });
  } catch (err) {
    next(err);
  }
}

async function updateApplicationStatus(req, res, next) {
  try {
    const applicationId = req.params.id;
    const recruiterId = req.user.userId;

    const applicationExist = await Application.findById(applicationId);

    if (!applicationExist) {
      return res.status(404).json({
        msg: "Application not found",
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
    const rejectedMove = transitionError(applicationExist.status, status);

    if (rejectedMove) {
      return res.status(400).json({
        msg: rejectedMove,
      });
    }

    const updated = await Application.findByIdAndUpdate(
      applicationId,
      {
        status,
        $push: {
          statusHistory: {
            status,
            actor: recruiterId,
            timestamp: new Date(),
          },
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    return res.status(200).json({
      msg: "Application status updated successfully",
      application: {
        ...updated.toObject(),
        nextStatuses: legalNextStatuses(updated.status),
      },
    });
  } catch (err) {
    next(err);
  }
}

function applicantKey(application) {
  return {
    overall: application.match?.overall ?? -1,
    label: String(application.candidate?.name ?? ""),
    id: String(application._id),
  };
}

function compareApplicants(left, right) {
  const leftKey = applicantKey(left);
  const rightKey = applicantKey(right);
  if (rightKey.overall !== leftKey.overall) {
    return rightKey.overall - leftKey.overall;
  }
  const byName = leftKey.label.localeCompare(rightKey.label);
  if (byName !== 0) {
    return byName;
  }
  return leftKey.id.localeCompare(rightKey.id);
}

export {
  applyForJob,
  getMyApplications,
  getMyApplication,
  getJobApplications,
  updateApplicationStatus,
};
