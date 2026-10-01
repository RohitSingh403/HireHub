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

async function fetchRecommendedJobs() {
  const response = await api.get("/api/jobs/recommended");
  return response.data.jobs;
}

async function fetchJobs(filters) {
  const response = await api.get("/api/jobs", {
    params: compactParams(filters),
  });
  return response.data.allJobs;
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
  fetchJobs,
  fetchJob,
  fetchMyJobs,
  createJob,
  updateJob,
};
