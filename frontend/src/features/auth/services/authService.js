import api from "../../../utils/api";

async function login(loginData) {
  const response = await api.post("/api/auth/login", loginData);
  return response.data;
}

export default login;
