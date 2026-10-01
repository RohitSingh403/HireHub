import api from "../../../utils/api";

async function register(data) {
  const response = await api.post("/api/auth/register", data);
  return response.data;
}

async function login(loginData) {
  const response = await api.post("/api/auth/login", loginData);
  return response.data;
}

async function getCurrentUser() {
  const response = await api.get("/api/auth/me");
  return response.data;
}

async function updateProfile(profile) {
  const response = await api.patch("/api/auth/me", profile);
  return response.data;
}

export { register, login, getCurrentUser, updateProfile };
