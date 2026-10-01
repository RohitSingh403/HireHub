import api from "../../../utils/api";

async function applyToJob(jobId) {
  const response = await api.post(`/api/jobs/${jobId}/apply`);
  return response.data;
}

async function fetchMyApplications() {
  const response = await api.get("/api/applications/me");
  return response.data.applications;
}

async function fetchMyApplication(id) {
  const response = await api.get(`/api/applications/${id}`);
  return response.data.application;
}

async function fetchJobApplications(jobId, cursor) {
  const response = await api.get(`/api/jobs/${jobId}/applications`, {
    params: cursor ? { cursor } : {},
  });
  return {
    applications: response.data.applications,
    nextCursor: response.data.nextCursor,
  };
}

async function updateApplicationStatus(id, status) {
  const response = await api.patch(`/api/applications/${id}/status`, {
    status,
  });
  return response.data;
}

export {
  applyToJob,
  fetchMyApplications,
  fetchMyApplication,
  fetchJobApplications,
  updateApplicationStatus,
};
