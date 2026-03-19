import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import Layout from "./components/Layout";
import { ThemeProvider } from "./context/ThemeContext";
import { CohortProvider } from "./context/CohortContext";
import { UserProvider, useUser } from "./context/UserContext";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/dashboardPage";
import LearningPage from "./pages/LearningPage";
import ActiveQuizPage from "./pages/ActiveQuizPage";
import QuizConfigPage from "./pages/QuizConfigPage";
import CreatePaperPage from "./pages/CreatePaperPage";
import ResultsPage from "./pages/ResultsPage";
import ResultDetailPage from "./pages/ResultDetailPage";
import QuizLobbyPage from "./pages/QuizLobbyPage";
import PeerQuizPage from "./pages/PeerQuizPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"; // NEW IMPORT
import Notification from "./pages/NotificationPage";
import ProctorDashboardPage from "./pages/ProctorDashboardPage";
import LeaderboardPage from "./pages/leaderboardpage";
import DiscussionForum from "./pages/DiscussionForum";
import CoursePage from "./pages/coursePage";
import ProfilePage from "./pages/ProfilePage";
const AppRoutes = () => {
  const { user, isAuthLoading } = useUser();
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE] dark:bg-[#0B0F19]">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">
          Verifying Session...
        </p>
      </div>
    );
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/course" element={<CoursePage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/config/:topicId" element={<QuizConfigPage />} />
            <Route
              path="/create-paper/:topicId"
              element={<CreatePaperPage />}
            />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/:resultId" element={<ResultDetailPage />} />
            <Route path="/peer-quiz" element={<PeerQuizPage />} />
            <Route
              path="/proctor/:roomCode"
              element={<ProctorDashboardPage />}
            />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/forum" element={<DiscussionForum />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="/lobby/:topicId" element={<QuizLobbyPage />} />
          <Route path="/quiz/:topicId" element={<ActiveQuizPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <CohortProvider>
            <AppRoutes />
          </CohortProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
