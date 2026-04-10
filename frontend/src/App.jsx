import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SessionExpiryWarning } from "./components/SessionExpiryWarning";
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
              path="/activity/monitoring"
              element={
                <ProtectedRoute allowedRoles={["Employee", "Admin"]}>
                  <ErrorBoundary>
                    <ActivityMonitoring />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activities"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <ErrorBoundary>
                    <AdminActivityDashboard />
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
              path="/admin/health"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <ErrorBoundary>
                    <AdminSystemHealth />
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
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;