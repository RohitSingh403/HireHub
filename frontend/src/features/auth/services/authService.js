import axios from "axios";

async function login(loginData) {
  const response = await axios.post("/api/auth/login", loginData);
  return response.data;
}

export default login;
