import api from "../../../utils/api";

async function fetchAdminStats() {
  const response = await api.get("/api/admin/stats");
  return response.data;
}

async function fetchAdminUsers(cursor) {
  const response = await api.get("/api/admin/users", {
    params: cursor ? { cursor } : {},
  });
  return {
    users: response.data.users,
    nextCursor: response.data.nextCursor,
  };
}

async function updateUserRole(userId, role) {
  const response = await api.patch(`/api/admin/users/${userId}`, { role });
  return response.data.user;
}

async function fetchAdminJobs(cursor) {
  const response = await api.get("/api/admin/jobs", {
    params: cursor ? { cursor } : {},
  });
  return {
    jobs: response.data.jobs,
    nextCursor: response.data.nextCursor,
  };
}

async function updateJobStatus(jobId, status) {
  const response = await api.patch(`/api/admin/jobs/${jobId}`, { status });
  return response.data.job;
}

async function fetchAdminCompanies(cursor) {
  const response = await api.get("/api/admin/companies", {
    params: cursor ? { cursor } : {},
  });
  return {
    companies: response.data.companies,
    nextCursor: response.data.nextCursor,
  };
}

export {
  fetchAdminStats,
  fetchAdminUsers,
  updateUserRole,
  fetchAdminJobs,
  updateJobStatus,
  fetchAdminCompanies,
};
