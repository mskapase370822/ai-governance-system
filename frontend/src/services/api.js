import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auto-logout on 401 (expired/invalid token)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// Auth
export const loginAPI = (data) => API.post("/auth/login", data);
export const registerAPI = (data) => API.post("/auth/register", data);
export const getUsersAPI = () => API.get("/auth/users");
export const updateUserRoleAPI = (id, role) => API.put(`/auth/users/${id}/role`, { role });

// Actions
export const submitActionAPI = (data) => API.post("/actions/submit", data);
export const confirmActionAPI = (logId) => API.put(`/actions/confirm/${logId}`);

// Logs
export const getMyLogsAPI = (params) => API.get("/logs/me", { params });
export const getAllLogsAPI = (params) => API.get("/logs", { params });
export const getAnomalyLogsAPI = () => API.get("/logs/anomalies");

// Alerts
export const getAlertsAPI = (params) => API.get("/alerts", { params });
export const markAlertReadAPI = (id) => API.put(`/alerts/${id}/read`);
export const markAllAlertsReadAPI = () => API.put("/alerts/read-all");

// Policies
export const getPoliciesAPI = () => API.get("/policies");
export const createPolicyAPI = (data) => API.post("/policies", data);
export const updatePolicyAPI = (id, data) => API.put(`/policies/${id}`, data);
export const togglePolicyAPI = (id) => API.put(`/policies/${id}/toggle`);
export const deletePolicyAPI = (id) => API.delete(`/policies/${id}`);

// Approvals
export const getPendingApprovalsAPI = () => API.get("/approvals/pending");
export const getAllApprovalsAPI = (params) => API.get("/approvals/all", { params });
export const getMyApprovalsAPI = () => API.get("/approvals/me");
export const approveRequestAPI = (id, note) => API.put(`/approvals/${id}/approve`, { reviewNote: note });
export const denyRequestAPI = (id, note) => API.put(`/approvals/${id}/deny`, { reviewNote: note });

// Analytics
export const getDashboardStatsAPI = () => API.get("/analytics/dashboard");
export const getUserStatsAPI = () => API.get("/analytics/me");

// User Activity Monitoring
export const submitActivityAPI = (inputText) => API.post("/activity/submit", { inputText });
export const getMyActivitiesAPI = (page = 1, limit = 20) =>
  API.get("/activity/me", { params: { page, limit } });
export const getAllActivitiesAPI = (page = 1, limit = 20) =>
  API.get("/activity/all", { params: { page, limit } });
export const getFilteredActivitiesAPI = (filters) =>
  API.get("/activity/filter", { params: filters });
export const flagActivityAPI = (id, reason) => API.put(`/activity/${id}/flag`, { reason });
export const approveActivityAPI = (id) => API.put(`/activity/${id}/approve`);
export const blockActivityAPI = (id) => API.put(`/activity/${id}/block`);
export const getActivityStatsAPI = () => API.get("/activity/stats/dashboard");
export const getActivityChartStatsAPI = (days = 30) =>
  API.get("/activity/stats/charts", { params: { days } });

// Reports
export const exportReportAPI = (params) =>
  API.post("/reports/export", null, { params, responseType: "blob" });

// Metrics / System Health
export const getSystemMetricsAPI = () => API.get("/metrics/all");

// ML Model
export const getMLStatsAPI  = () => API.get("/ml/stats");
export const trainMLModelAPI = (options = {}) => API.post("/ml/train", options);
export const analyzeRiskAPI = (text) => API.post("/ml/analyze-risk", { text });

// Audit Log
export const getAuditLogsAPI = (params) => API.get("/audit", { params });

export default API;