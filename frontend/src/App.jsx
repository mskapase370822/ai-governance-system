import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SessionExpiryWarning } from "./components/SessionExpiryWarning";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ActivityMonitoring from "./pages/ActivityMonitoring";
import AdminReportsPage from "./pages/AdminReportsPage";

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
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <ErrorBoundary>
                    <AdminReportsPage />
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