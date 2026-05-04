import axios from "axios";
import type { LoginUserData, UserData } from "../lib/Types";

const baseUrl = import.meta.env.VITE_API_URL;

export async function signupUser(data: UserData) {
  console.log(data);

  const response = await axios.post(`${baseUrl}/auth/signup`, data);
  return response.data;
}

export async function loginUser(data: LoginUserData) {
  const response = await axios.post(`${baseUrl}/auth/login`, data, {
    withCredentials: true,
  });
  return response.data;
}

export async function getAuthUser() {
  const response = await axios.get(`${baseUrl}/api/user/jwt`, {
    withCredentials: true,
  });
  return response.data;
}

export async function logoutUser() {
  const response = await axios.post(
    `${baseUrl}/auth/logout`,
    {},
    { withCredentials: true },
  );
  return response.data;
}

export async function updateUser(username: string, id: number) {
  const response = await axios.put(`${baseUrl}/api/user/${id}`, {username}, {
    withCredentials: true,
  });
  return response.data;
}
