import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "./components/Layout";
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
import ProctorDashboardPage from './pages/ProctorDashboardPage';
import { ThemeProvider } from "./context/ThemeContext";
import { CohortProvider } from "./context/CohortContext";
import { UserProvider, useUser } from "./context/UserContext";

const AuthGuard = () => {
  const { user, isAuthLoading } = useUser();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-500 font-bold">Verifying Session...</p>
      </div>
    );
  }
  if (!user) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LearningPage />} />
          <Route path="/config/:topicId" element={<QuizConfigPage />} />
          <Route path="/create-paper/:topicId" element={<CreatePaperPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/results/:resultId" element={<ResultDetailPage />} />
          <Route path="/peer" element={<PeerQuizPage />} />
          <Route path="/proctor/:roomCode" element={<ProctorDashboardPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
        </Route>

        <Route path="/lobby/:topicId" element={<QuizLobbyPage />} />
        <Route path="/quiz/:topicId" element={<ActiveQuizPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <CohortProvider>
          <AuthGuard />
        </CohortProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
