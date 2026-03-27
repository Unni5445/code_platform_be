import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import AuthLayout from "@/layouts/AuthLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import CoursesPage from "@/pages/CoursesPage";
import TestsPage from "@/pages/TestsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import CertificatesPage from "@/pages/CertificatesPage";
import CertificateDetailPage from "@/pages/CertificateDetailPage";
import SystemPage from "@/pages/SystemPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TestSubmissionsPage from "./pages/TestSubmissionsPage";
import SubmissionDetailPage from "./pages/SubmissionDetailPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#1f2937",
              color: "#fff",
              fontSize: "14px",
            },
          }}
        />
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/tests/:id/submissions" element={<TestSubmissionsPage />} />
              <Route path="/tests/:id/submissions/:submissionId" element={<SubmissionDetailPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/certificates/:id" element={<CertificateDetailPage />} />
              <Route path="/system" element={<SystemPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
