import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ActivityMonitoring from "./pages/ActivityMonitoring";
import AdminActivityDashboard from "./pages/AdminActivityDashboard";
import AdminEmailSettings from "./pages/AdminEmailSettings";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminSystemHealth from "./pages/AdminSystemHealth";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Employee"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity/monitoring"
            element={
              <ProtectedRoute allowedRoles={["Employee", "Admin"]}>
                <ActivityMonitoring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activities"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminActivityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/health"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminSystemHealth />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/email-settings"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminEmailSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;