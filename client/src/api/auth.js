import axios from "./axios";

export async function loginApi(formData) {
  const { data } = await axios.post("/auth/login", formData);
  return data;
}

export async function refreshTokenApi(token) {
  const { data } = await axios.post("/auth/refresh_access_token", { token });
  return data;
}