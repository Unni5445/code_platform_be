import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    // "Content-Type": "application/json",
    "x-api-key": import.meta.env.VITE_API_KEY,
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;

    if (status === 401 && currentPath !== "/login" && !currentPath.startsWith("/verify-certificate")) {
      // Clear any stale local state if necessary
      // window.localStorage.removeItem("user"); 
      window.location.href = "/login?redirect=" + encodeURIComponent(currentPath);
    }
    return Promise.reject(error);
  }
);

export default api;
