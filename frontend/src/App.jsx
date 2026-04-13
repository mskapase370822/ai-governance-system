import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SessionExpiryWarning } from "./components/SessionExpiryWarning";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminActivityDashboard from "./pages/AdminActivityDashboard";
import AdminEmailSettings from "./pages/AdminEmailSettings";
import AdminSystemHealth from "./pages/AdminSystemHealth";
import AdminReportsPage from "./pages/AdminReportsPage";
import ManagerDashboard from "./pages/ManagerDashboard";
import ActivityMonitoring from "./pages/ActivityMonitoring";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <SessionExpiryWarning />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["Employee"]}>
                  <ErrorBoundary>
                    <UserDashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={["Manager"]}>
                  <ErrorBoundary>
                    <ManagerDashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <ErrorBoundary>
                    <AdminDashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <ErrorBoundary>
                    <AdminActivityDashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/email-settings"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <ErrorBoundary>
                    <AdminEmailSettings />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/system-health"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <ErrorBoundary>
                    <AdminSystemHealth />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <ErrorBoundary>
                    <AdminReportsPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity/monitoring"
              element={
                <ProtectedRoute allowedRoles={["Employee", "Admin", "Manager"]}>
                  <ErrorBoundary>
                    <ActivityMonitoring />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;