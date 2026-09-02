import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api",
  withCredentials: true,
});

// Đính kèm access token (JWT) vào mỗi request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động logout khi token hết hạn (401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
