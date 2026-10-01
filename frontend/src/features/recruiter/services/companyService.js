import api from "../../../utils/api";

async function fetchMyCompany() {
  const response = await api.get("/api/companies/me");
  return response.data.company;
}

async function createCompany(payload) {
  const response = await api.post("/api/companies", payload);
  return response.data.company;
}

async function updateCompany(id, payload) {
  const response = await api.patch(`/api/companies/${id}`, payload);
  return response.data.company;
}

export { fetchMyCompany, createCompany, updateCompany };
