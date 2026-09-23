import api from "../../../utils/api";

async function login(loginData) {
  const response = await api.post("/api/auth/login", loginData);
  return response.data;
}

async function getCurrentUser() {
  const response = await api.get("/api/auth/me");
  return response.data;
}

export { login, getCurrentUser };
