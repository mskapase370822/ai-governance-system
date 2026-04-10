import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ActivityMonitoring from "./pages/ActivityMonitoring";
import AdminActivityDashboard from "./pages/AdminActivityDashboard";

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
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={["Manager"]}>
                <ManagerDashboard />
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
              <ProtectedRoute allowedRoles={["Employee", "Manager", "Admin"]}>
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;