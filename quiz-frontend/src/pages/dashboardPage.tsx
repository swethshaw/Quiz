import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ChevronRight,
  CalendarDays,
  Flame,
  Zap,
  ChevronDown,
  Users,
  Play,
  BookOpen,
  Target,
  Activity,
  LayoutGrid,
  Inbox,
  ChevronLeft,
  BarChart3,
  Layout,
} from "lucide-react";
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ==========================================
// MAIN DASHBOARD CONTAINER
// ==========================================
export default function Dashboard() {
  const navigate = useNavigate();
  const { activeCohort, cohortData, isLoading, refreshData } = useCohort();
  const { user } = useUser();

  const [visibleCount, setVisibleCount] = useState(4);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | string>("...");
  const [activeRooms, setActiveRooms] = useState<any[]>([]);

  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [topicProgress, setTopicProgress] = useState<any>({});
  const [streak, setStreak] = useState(0);

useEffect(() => {
  refreshData();
  setVisibleCount(4);

  if (!activeCohort || !user) return;

  const fetchDashboardData = async () => {
    try {
      // 1. Fire all requests simultaneously
      const [leadRes, roomRes, actRes, dashRes] = await Promise.all([
        fetch(`${API_URL}/api/leaderboard/cohort/${encodeURIComponent(activeCohort)}`),
        fetch(`${API_URL}/api/rooms/active`),
        fetch(`${API_URL}/api/results/activity/${user._id}`),
        fetch(`${API_URL}/api/results/dashboard/${user._id}`)
      ]);

      // 2. Parse all JSON simultaneously
      const [leadData, roomData, actData, dashData] = await Promise.all([
        leadRes.json().catch(() => ({ success: false })),
        roomRes.json().catch(() => ({ success: false })),
        actRes.json().catch(() => ({ success: false })),
        dashRes.json().catch(() => ({ success: false }))
      ]);

      // 3. Process Leaderboard Data
      if (leadData?.success) {
        setLeaders(leadData.data);
        const myRankObj = leadData.data.find((u: any) => u.id === user._id);
        setUserRank(myRankObj ? myRankObj.rank : "Unranked");
      }

      // 4. Process Active Rooms Data
      if (roomData?.success) setActiveRooms(roomData.data);

      // 5. Process Activity Data
      if (actData?.success) {
        const activityMap: Record<string, number> = {};
        actData.data.forEach((day: any) => {
          activityMap[day._id] = day.totalScore;
        });
        setActivityData(activityMap);

        let currentStreak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (activityMap[dateStr] && activityMap[dateStr] > 0) currentStreak++;
          else if (i > 0) break;
        }
        setStreak(currentStreak);
      }

      // 6. Process Dashboard Progress Data
      if (dashData?.success) setTopicProgress(dashData.data);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  fetchDashboardData();
}, [refreshData, activeCohort, user]);

  const displayTopics = useMemo(() => {
    return topicProgress[activeCohort]?.length > 0
      ? topicProgress[activeCohort]
      : cohortData[activeCohort] || [];
  }, [topicProgress, activeCohort, cohortData]);

  const stats = useMemo(() => {
    const total = displayTopics.length;
    let quizzesDone = 0;
    let totalAccuracy = 0;

    displayTopics.forEach((t: any) => {
      const solved = t.solvedQuestions || 0;
      const totalQ = t.totalQuestions || 0;
      if (solved > 0) quizzesDone++;
      if (totalQ > 0) totalAccuracy += (solved / totalQ) * 100;
    });

    return {
      total,
      theoryCompleted: 0,
      quizzesDone,
      avgQuizScore: total > 0 ? Math.round(totalAccuracy / total) : 0,
    };
  }, [displayTopics]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-violet-200 dark:border-violet-900/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">
          Syncing Workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 p-4 md:p-8 font-sans overflow-x-hidden transition-colors duration-300">
      <div className="mx-auto space-y-8">
        <WelcomeBanner
          user={user}
          streak={streak}
          activeCohort={activeCohort}
          userRank={userRank}
          navigate={navigate}
        />

        <QuickStats stats={stats} userRank={userRank} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <HeatmapWidget activityData={activityData} />
            <TopicBreakdownWidget
              displayTopics={displayTopics}
              visibleCount={visibleCount}
              setVisibleCount={setVisibleCount}
              stats={stats}
              navigate={navigate}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <ActiveLobbiesWidget
              activeRooms={activeRooms}
              navigate={navigate}
            />
            <LeaderboardWidget
              leaders={leaders}
              user={user}
              navigate={navigate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODULAR COMPONENTS
// ==========================================

function WelcomeBanner({ user, streak, activeCohort, userRank, navigate }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-linear-to-r from-violet-600 via-violet-500 to-indigo-600 rounded-4xl p-8 md:p-10 text-white shadow-2xl shadow-violet-500/20 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-110"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 text-xs font-black tracking-widest uppercase shadow-sm">
            <Flame size={14} className="text-amber-300" />
            {streak} Day Streak
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-sm">
            Welcome back, {user?.name?.split(" ")[0] || "Student"}!
          </h2>
          <p className="text-violet-100 max-w-xl font-medium text-lg leading-relaxed">
            You are dominating the{" "}
            <span className="font-bold text-white border-b-2 border-amber-300">
              {activeCohort}
            </span>{" "}
            track. Currently ranked{" "}
            <span className="text-amber-300 font-black px-1">#{userRank}</span>{" "}
            on the global leaderboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 mt-2">
          <button
            onClick={() => navigate("/learning")}
            className="bg-white text-violet-700 px-6 py-3.5 rounded-xl font-bold hover:bg-violet-50 hover:-translate-y-1 transition-all shadow-xl shadow-black/10 text-sm flex items-center justify-center gap-2"
          >
            <BookOpen size={18} /> Resume Modules
          </button>
          <button
            onClick={() => navigate("/peer-quiz")}
            className="bg-violet-900/40 backdrop-blur-md text-white px-6 py-3.5 rounded-xl font-bold hover:bg-violet-900/60 hover:-translate-y-1 transition-all border border-violet-400/30 shadow-xl shadow-black/10 text-sm flex items-center justify-center gap-2"
          >
            <Users size={18} /> Host Peer Session
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function QuickStats({ stats, userRank }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
    >
      <StatCard
        icon={<LayoutGrid />}
        title="Theory"
        value={`${stats.theoryCompleted}/${stats.total}`}
        subtitle="Modules Completed"
        color="text-blue-500"
        bg="bg-blue-50 dark:bg-blue-500/10"
      />
      <StatCard
        icon={<Target />}
        title="Accuracy"
        value={`${stats.avgQuizScore}%`}
        subtitle="Average Score"
        color="text-emerald-500"
        bg="bg-emerald-50 dark:bg-emerald-500/10"
      />
      <StatCard
        icon={<Activity />}
        title="Quizzes"
        value={`${stats.quizzesDone}/${stats.total}`}
        subtitle="Total Attempted"
        color="text-violet-500"
        bg="bg-violet-50 dark:bg-violet-500/10"
      />
      <StatCard
        icon={<Trophy />}
        title="Rank"
        value={typeof userRank === "number" ? `#${userRank}` : userRank}
        subtitle="Cohort Placement"
        color="text-amber-500"
        bg="bg-amber-50 dark:bg-amber-500/10"
      />
    </motion.div>
  );
}

function StatCard({ icon, title, value, subtitle, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-4xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {title}
        </p>
        <div
          className={`p-2.5 md:p-3 rounded-2xl ${bg} group-hover:scale-110 transition-transform ${color}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight truncate drop-shadow-sm">
        {value}
      </p>
      <div className="text-xs md:text-sm font-bold text-slate-500">
        {subtitle}
      </div>
    </div>
  );
}

function HeatmapWidget({ activityData }: any) {
  const [heatmapMode, setHeatmapMode] = useState<"month" | "year">("month");
  const [dateOffset, setDateOffset] = useState(0);

  const renderHeatmap = () => {
    const today = new Date();

    if (heatmapMode === "month") {
      const targetDate = new Date(
        today.getFullYear(),
        today.getMonth() - dateOffset,
        1,
      );
      const daysInMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
      ).getDate();
      const monthName = targetDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });

      const days = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(targetDate.getFullYear(), targetDate.getMonth(), i);
        const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const score = activityData[dateString] || 0;
        days.push({ date: d, dateString, score });
      }

      return (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              {monthName}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setDateOffset((p) => p + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setDateOffset((p) => Math.max(0, p - 1))}
                disabled={dateOffset === 0}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(28px,1fr))] sm:grid-cols-7 md:grid-cols-10 gap-2">
            {days.map(({ date, dateString, score }) => {
              let colorClass =
                "bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700";
              if (score > 0 && score <= 5)
                colorClass =
                  "bg-violet-200 border-violet-300 dark:bg-violet-900/50 dark:border-violet-800";
              else if (score > 5 && score <= 15)
                colorClass = "bg-violet-400 border-violet-500";
              else if (score > 15)
                colorClass =
                  "bg-violet-600 border-violet-700 shadow-[0_0_10px_rgba(124,58,237,0.4)]";

              return (
                <div
                  key={dateString}
                  className={`relative aspect-square rounded-lg transition-all duration-300 hover:scale-110 hover:z-10 group cursor-pointer ${colorClass}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-400 opacity-50 group-hover:opacity-0 transition-opacity">
                    {date.getDate()}
                  </span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                    {date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    :{" "}
                    <span className="text-violet-400 dark:text-violet-600">
                      {score} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    } else {
      const targetYear = today.getFullYear() - dateOffset;
      const months = Array.from({ length: 12 }, (_, i) => {
        const monthPrefix = `${targetYear}-${String(i + 1).padStart(2, "0")}`;
        const monthlyScore = Object.keys(activityData)
          .filter((k) => k.startsWith(monthPrefix))
          .reduce((sum, key) => sum + activityData[key], 0);
        return {
          name: new Date(targetYear, i).toLocaleDateString(undefined, {
            month: "short",
          }),
          score: monthlyScore,
        };
      });

      const maxScore = Math.max(...months.map((m) => m.score), 1);

      return (
        <>
          <div className="flex items-center justify-between mb-6">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              {targetYear} Overview
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setDateOffset((p) => p + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setDateOffset((p) => Math.max(0, p - 1))}
                disabled={dateOffset === 0}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-end justify-between h-40 gap-2">
            {months.map(({ name, score }) => (
              <div
                key={name}
                className="flex-1 flex flex-col items-center gap-2 group relative"
              >
                <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-t-lg relative flex items-end overflow-hidden group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors h-32">
                  <div
                    className="w-full bg-linear-to-t from-violet-600 to-violet-400 rounded-t-sm transition-all duration-700 ease-out"
                    style={{ height: `${(score / maxScore) * 100}%` }}
                  />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {score} pts
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-900 rounded-4xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <CalendarDays className="text-violet-500" size={24} /> Performance
            Heatmap
          </h3>
          <p className="text-sm font-medium text-slate-500">
            Track your consistency and earned points over time.
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl shrink-0 self-start">
          <button
            onClick={() => {
              setHeatmapMode("month");
              setDateOffset(0);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${heatmapMode === "month" ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <Layout size={14} /> Month
          </button>
          <button
            onClick={() => {
              setHeatmapMode("year");
              setDateOffset(0);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${heatmapMode === "year" ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <BarChart3 size={14} /> Year
          </button>
        </div>
      </div>

      <div className="min-h-55">{renderHeatmap()}</div>

      {heatmapMode === "month" && (
        <div className="flex items-center justify-end gap-2 mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Less</span>
          <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="w-3 h-3 rounded bg-violet-200 dark:bg-violet-900/50" />
          <div className="w-3 h-3 rounded bg-violet-400" />
          <div className="w-3 h-3 rounded bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
          <span>More</span>
        </div>
      )}
    </motion.div>
  );
}

function TopicBreakdownWidget({
  displayTopics,
  visibleCount,
  setVisibleCount,
  stats,
  navigate,
}: any) {
  const visibleTopics = displayTopics.slice(0, visibleCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-4xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
        <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="text-violet-500" size={24} /> Module Breakdown
        </h3>
        <span className="text-xs font-black tracking-widest uppercase text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-4 py-1.5 rounded-full border border-violet-100 dark:border-violet-800/50">
          {stats.total} Tracks
        </span>
      </div>

      <div className="space-y-4">
        {visibleTopics.length > 0 ? (
          <>
            {visibleTopics.map((topic: any) => {
              const theoryWidth = topic.theoryCompleted || topic.isRead ? 100 : 0;
              const totalQ = topic.totalQuestions || 0;
              const solvedQ = topic.solvedQuestions || 0;
              const quizWidth =
                totalQ > 0 ? Math.round((solvedQ / totalQ) * 100) : 0;

              return (
                <div
                  key={topic._id}
                  className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-center mb-5">
                    <span className="font-black text-slate-800 dark:text-slate-200 text-lg group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {topic.title}
                    </span>
                    <button
                      onClick={() => navigate(`/config/${topic._id}`)}
                      className="text-slate-500 hover:text-white text-sm font-bold flex items-center transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-violet-600 hover:border-violet-600 dark:hover:bg-violet-500 px-4 py-2 rounded-xl shadow-sm"
                    >
                      Practice <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                        <span>Theory Mastery</span>
                        <span
                          className={theoryWidth === 100 ? "text-emerald-500" : ""}
                        >
                          {theoryWidth}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/50">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${theoryWidth}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                        <span>Quiz Accuracy</span>
                        <span
                          className={quizWidth >= 80 ? "text-violet-500" : ""}
                        >
                          {quizWidth}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/50">
                        <div
                          className="h-full bg-linear-to-r from-violet-400 to-violet-600 rounded-full transition-all duration-1000"
                          style={{ width: `${quizWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <AnimatePresence>
              {visibleCount < displayTopics.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-4 flex justify-center"
                >
                  <button
                    onClick={() => setVisibleCount((prev: number) => prev + 4)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    Show More Modules <ChevronDown size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <Inbox size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-bold text-lg">
              No curriculum assigned yet.
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Select a different cohort or check back later.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ActiveLobbiesWidget({ activeRooms, navigate }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-4x1 p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="text-amber-500" size={24} fill="currentColor" /> Active
          Lobbies
        </h3>
        {activeRooms.length > 0 && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>

      <div className="space-y-3">
        {activeRooms.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <Users
              size={32}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
            />
            <p className="text-sm font-bold text-slate-500 mb-4">
              The arena is quiet right now.
            </p>
            <button
              onClick={() => navigate("/peer-quiz")}
              className="w-full py-3 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-xl text-sm font-black hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors uppercase tracking-widest border border-violet-200 dark:border-violet-800/50"
            >
              Host a Session
            </button>
          </div>
        ) : (
          activeRooms.slice(0, 3).map((room: any) => (
            <div
              key={room._id}
              className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="font-black text-base text-slate-800 dark:text-slate-200 truncate pr-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {room.topicId?.title || "Custom Assesment"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Host: {room.hostId?.name?.split(" ")[0] || "Peer"}
                </p>
                <button
                  onClick={() => navigate(`/peer-quiz?join=${room.code}`)}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-xl text-xs font-bold hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all hover:-translate-y-0.5 shadow-md flex items-center gap-1"
                >
                  <Play size={12} fill="currentColor" /> Enter
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function LeaderboardWidget({ leaders, user, navigate }: any) {
  // Logic to show top 3, plus user's rank if not in top 3
  const top3 = leaders.slice(0, 3);
  const myRankObj = leaders.find((l: any) => l.id === user?._id);
  const amIInTop3 = top3.some((l: any) => l.id === user?._id);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white dark:bg-slate-900 rounded-4xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <h3 className="font-black text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Trophy className="text-amber-500" size={24} /> Top Performers
      </h3>
      <div className="space-y-3">
        {leaders.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <Trophy
              size={32}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
            />
            <p className="text-sm font-bold text-slate-500">
              Leaderboard is waiting to be conquered.
            </p>
          </div>
        ) : (
          <>
            {top3.map((leader: any, index: number) => {
              const rank = index + 1;
              return (
                <div
                  key={leader.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                        rank === 1
                          ? "bg-linear-to-br from-amber-300 to-amber-500 text-white ring-2 ring-amber-200 dark:ring-amber-900"
                          : rank === 2
                            ? "bg-linear-to-br from-slate-300 to-slate-400 text-white"
                            : "bg-linear-to-br from-orange-300 to-orange-500 text-white"
                      }`}
                    >
                      #{rank}
                    </div>
                    <div>
                      <span className="font-black text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {leader.name}{" "}
                        {leader.id === user?._id && (
                          <span className="text-[9px] bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 px-2 py-0.5 rounded-full uppercase tracking-widest border border-violet-200 dark:border-violet-700/50">
                            You
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {leader.points} XP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Display user at the bottom if they aren't in the top 3 */}
            {!amIInTop3 && myRankObj && (
              <>
                <div className="flex justify-center py-1">
                  <div className="w-1 bg-slate-200 dark:bg-slate-700 h-1 rounded-full my-0.5"></div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-900/20 border border-violet-200/50 dark:border-violet-800/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      #{myRankObj.rank}
                    </div>
                    <div>
                      <span className="font-black text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {myRankObj.name}{" "}
                        <span className="text-[9px] bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 px-2 py-0.5 rounded-full uppercase tracking-widest border border-violet-200 dark:border-violet-700/50">
                          You
                        </span>
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {myRankObj.points} XP
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/50">
          <button
            onClick={() => navigate("/leaderboard")}
            className="w-full py-3.5 text-center text-sm font-black tracking-widest uppercase text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md"
          >
            View Global Ranks
          </button>
        </div>
      </div>
    </motion.div>
  );
}