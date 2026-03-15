import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import AuthLayout from "@/layouts/AuthLayout";
import { Spinner } from "@/components/ui/Spinner";

import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import CoursesPage from "@/pages/CoursesPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import TestsPage from "@/pages/TestsPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import ActivityPage from "@/pages/ActivityPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import AllCoursesPage from "./pages/AllCoursesPage";
import CertificatePage from "@/pages/CertificatePage";
import PlaygroundPage from "@/pages/PlaygroundPage";
import PlaygroundPracticePage from "@/pages/PlaygroundPracticePage";

const TestTakePage = lazy(() => import("@/pages/TestTakePage"));

function LazyFallback() {
  return (
    <div className="mc-page flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

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
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Test taking - fullscreen, no sidebar */}
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route
              path="/tests/:id/take"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <TestTakePage />
                </Suspense>
              }
            />
          </Route>

          {/* Dashboard routes with sidebar */}
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* <Route path="/courses" element={<CoursesPage />} /> */}
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/certificates/:courseId" element={<CertificatePage />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/playground/:id" element={<PlaygroundPracticePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/courses" element={<AllCoursesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
