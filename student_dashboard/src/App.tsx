import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import AuthLayout from "@/layouts/AuthLayout";
import { Spinner } from "@/components/ui/Spinner";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import OnboardingPage from "@/pages/OnboardingPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import TestsPage from "@/pages/TestsPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import ActivityPage from "@/pages/ActivityPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import AllCoursesPage from "./pages/AllCoursesPage";
import CertificatePage from "@/pages/CertificatePage";
import QuestMapPage from "@/pages/QuestMapPage";
import ArenaPage from "@/pages/ArenaPage";
import ContestArenaPage from "@/pages/ContestArenaPage";
import ContestBattlePage from "@/pages/ContestBattlePage";
import MockInterviewsPage from "@/pages/MockInterviewsPage";
import InterviewPlayPage from "@/pages/InterviewPlayPage";
import TestResultPage from "@/pages/TestResultPage";
import ContestResultPage from "@/pages/ContestResultPage";

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
              background: "#fff",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
          }}
        />
        <Routes>
          {/* Landing page - public */}
          <Route path="/" element={<LandingPage />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Onboarding route - restricted if already onboarded */}
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} requireNotOnboarded />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Test taking - fullscreen, no sidebar */}
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} requireOnboarding />}>
            <Route
              path="/tests/:id/take"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <TestTakePage />
                </Suspense>
              }
            />
          </Route>

          {/* Contest taking - fullscreen, no sidebar */}
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} requireOnboarding />}>
            <Route
              path="/contests/:id/battle"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <ContestBattlePage />
                </Suspense>
              }
            />
          </Route>

          {/* Interview play - fullscreen, no sidebar */}
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} requireOnboarding />}>
            <Route
              path="/interviews/:id/play"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <InterviewPlayPage />
                </Suspense>
              }
            />
          </Route>

          {/* Dashboard routes with sidebar */}
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} requireOnboarding />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* <Route path="/courses" element={<CoursesPage />} /> */}
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/certificates/:courseId" element={<CertificatePage />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/tests/results/:id" element={<TestResultPage />} />
              <Route path="/quests" element={<QuestMapPage />} />
              <Route path="/arena/:id" element={<ArenaPage />} />
              <Route path="/contests" element={<ContestArenaPage />} />
              <Route path="/contests/:id/results" element={<ContestResultPage />} />
              <Route path="/interviews" element={<MockInterviewsPage />} />
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
