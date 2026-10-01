import api from "../../../utils/api";

function compactParams(filters) {
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params[key] = value;
    }
  }
  return params;
}

async function fetchRecommendedJobs(cursorOrOptions) {
  const options =
    typeof cursorOrOptions === "string"
      ? { cursor: cursorOrOptions }
      : cursorOrOptions || {};
  const response = await api.get("/api/jobs/recommended", {
    params: compactParams(options),
  });
  return {
    jobs: response.data.jobs,
    nextCursor: response.data.nextCursor,
  };
}

async function matchForJob(jobId) {
  let cursor;
  for (let pageNumber = 0; pageNumber < 8; pageNumber += 1) {
    const page = await fetchRecommendedJobs({ cursor, limit: 50 });
    const found = page.jobs.find((item) => item.job?._id === jobId);
    if (found) {
      return found.match;
    }
    if (!page.nextCursor) {
      return null;
    }
    cursor = page.nextCursor;
  }
  return null;
}
async function matchScoresFor(jobIds) {
  const wanted = new Set(jobIds);
  const scores = {};
  let cursor;
  for (let pageNumber = 0; pageNumber < 8 && wanted.size > 0; pageNumber += 1) {
    const page = await fetchRecommendedJobs({ cursor, limit: 50 });
    for (const item of page.jobs) {
      const id = item.job?._id;
      if (id && wanted.has(id)) {
        scores[id] = item.match?.overall;
        wanted.delete(id);
      }
    }
    if (!page.nextCursor) {
      break;
    }
    cursor = page.nextCursor;
  }
  return scores;
}

async function fetchJobs(filters) {
  const response = await api.get("/api/jobs", {
    params: compactParams(filters),
  });
  return {
    jobs: response.data.allJobs,
    nextCursor: response.data.nextCursor,
  };
}

async function fetchJob(id) {
  const response = await api.get(`/api/jobs/${id}`);
  return response.data.job;
}

async function fetchMyJobs() {
  const response = await api.get("/api/jobs/mine");
  return response.data.jobs;
}

async function createJob(payload) {
  const response = await api.post("/api/jobs", payload);
  return response.data.job;
}

async function updateJob(id, payload) {
  const response = await api.patch(`/api/jobs/${id}`, payload);
  return response.data.job;
}

export {
  fetchRecommendedJobs,
  matchScoresFor,
  matchForJob,
  fetchJobs,
  fetchJob,
  fetchMyJobs,
  createJob,
  updateJob,
};
