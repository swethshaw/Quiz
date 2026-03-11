import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, ChevronRight, CalendarDays, Flame,
  Zap, ChevronDown, Users, Play, BookOpen, Target, Activity, LayoutGrid, Inbox
} from 'lucide-react';
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
      // 1. Fetch Leaderboard
      try {
        const leadRes = await fetch(`${API_URL}/api/leaderboard/cohort/${encodeURIComponent(activeCohort)}`);
        const leadData = await leadRes.json();
        if (leadData.success) {
          setLeaders(leadData.data.slice(0, 3));
          const myRankObj = leadData.data.find((u: any) => u.id === user._id);
          setUserRank(myRankObj ? myRankObj.rank : "Unranked");
        }
      } catch (err) { console.error("Leaderboard error:", err); }

      // 2. Fetch Active Rooms
      try {
        const roomRes = await fetch(`${API_URL}/api/rooms/active`);
        const roomData = await roomRes.json();
        if (roomData.success) setActiveRooms(roomData.data);
      } catch (err) { console.error("Active rooms error:", err); }

      // 3. Fetch Activity Heatmap & Calculate Streak
      try {
        const actRes = await fetch(`${API_URL}/api/results/activity/${user._id}`);
        const actData = await actRes.json();
        if (actData.success) {
          const activityMap: Record<string, number> = {};
          actData.data.forEach((day: any) => {
            activityMap[day._id] = day.totalScore; 
          });
          setActivityData(activityMap);

          // --- STREAK CALCULATION LOGIC ---
          let currentStreak = 0;
          const today = new Date();
          for (let i = 0; i < 36; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            if (activityMap[dateStr] && activityMap[dateStr] > 0) {
              currentStreak++;
            } else if (i > 0) {
              // If it's not today (i=0) and there are no points, the streak is broken
              break;
            }
          }
          setStreak(currentStreak);
        }
      } catch (err) { console.error("Activity error:", err); }

      // 4. Fetch Detailed Topic Progress (Accuracy & Breakdown)
      try {
        const dashRes = await fetch(`${API_URL}/api/results/dashboard/${user._id}`);
        const dashData = await dashRes.json();
        if (dashData.success) {
          setTopicProgress(dashData.data);
        }
      } catch (err) { console.error("Dashboard progress error:", err); }
    };

    fetchDashboardData();
  }, [refreshData, activeCohort, user]);

  // Use the fetched backend progress data, fallback to basic cohortData if not loaded yet
  const displayTopics = useMemo(() => {
    return topicProgress[activeCohort]?.length > 0 ? topicProgress[activeCohort] : (cohortData[activeCohort] || []);
  }, [topicProgress, activeCohort, cohortData]);

  const visibleTopics = useMemo(() => displayTopics.slice(0, visibleCount), [displayTopics, visibleCount]);

  // --- STATS CALCULATION LOGIC ---
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

    const avgQuizScore = total > 0 ? Math.round(totalAccuracy / total) : 0;

    return { 
      total, 
      theoryCompleted: 0, // Placeholder until LMS theory tracking is implemented
      quizzesDone, 
      avgQuizScore 
    };
  }, [displayTopics]);

  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 35; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, dateString });
    }
    return days;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 p-4 md:p-8 font-sans overflow-x-hidden">
      
      <div className="mx-auto space-y-8">
        {/* 1. WELCOME BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-violet-600 via-violet-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 mb-4 text-xs font-bold tracking-widest uppercase">
                <Flame size={14} className="text-amber-300" /> 
                {streak} Day Streak
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || "Student"}!
              </h2>
              <p className="text-violet-100 max-w-xl font-medium text-lg opacity-90">
                You are on the <span className="font-bold text-white">{activeCohort}</span> track. 
                Currently ranked <span className="text-amber-300 font-black">#{userRank}</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0 mt-4 md:mt-0">
              <button 
                onClick={() => navigate('/learning')} 
                className="bg-white text-violet-700 px-6 py-3 rounded-xl font-bold hover:bg-violet-50 hover:scale-105 transition-all shadow-md text-sm flex items-center gap-2"
              >
                <BookOpen size={16} /> Resume Learning
              </button>
              <button 
                onClick={() => navigate('/peer-quiz')} 
                className="bg-violet-800/40 backdrop-blur-md text-white px-6 py-3 rounded-xl font-bold hover:bg-violet-800/60 hover:scale-105 transition-all border border-violet-400/30 shadow-md text-sm flex items-center gap-2"
              >
                <Users size={16} /> Peer Challenge
              </button>
            </div>
          </div>
        </motion.div>

        {/* 2. QUICK STATS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard icon={<LayoutGrid />} title="Theory Modules" value={`${stats.theoryCompleted}/${stats.total}`} subtitle="Completed" color="text-blue-500" />
          <StatCard icon={<Target />} title="Quiz Accuracy" value={`${stats.avgQuizScore}%`} subtitle="Average Score" color="text-emerald-500" />
          <StatCard icon={<Activity />} title="Quizzes Taken" value={`${stats.quizzesDone}/${stats.total}`} subtitle="Attempted" color="text-violet-500" />
          <StatCard icon={<Trophy />} title="Cohort Rank" value={typeof userRank === 'number' ? `#${userRank}` : userRank} subtitle="Leaderboard" color="text-amber-500" />
        </motion.div>

        {/* 3. MAIN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* HEATMAP */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarDays className="text-violet-500" size={20} />
                    Activity Heatmap
                  </h3>
                  <p className="text-sm text-slate-500">Points earned over the last 36 days</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[repeat(auto-fit,minmax(24px,1fr))] md:grid-cols-12 gap-2">
                {heatmapDays.map(({ date, dateString }) => {
                  const score = activityData[dateString] || 0;
                  
                  let colorClass = 'bg-slate-100 dark:bg-slate-800'; 
                  if (score > 0 && score <= 5) colorClass = 'bg-violet-200 dark:bg-violet-900/40';
                  else if (score > 5 && score <= 15) colorClass = 'bg-violet-400';
                  else if (score > 15) colorClass = 'bg-violet-600';

                  return (
                    <div 
                      key={dateString} 
                      className={`relative aspect-square rounded-md transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-violet-300 hover:z-10 group cursor-pointer ${colorClass}`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: {score} pts
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-end gap-2 mt-6 text-xs font-bold text-slate-400">
                <span>Less</span>
                <div className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-800" />
                <div className="w-4 h-4 rounded-sm bg-violet-200 dark:bg-violet-900/40" />
                <div className="w-4 h-4 rounded-sm bg-violet-400" />
                <div className="w-4 h-4 rounded-sm bg-violet-600" />
                <span>More</span>
              </div>
            </motion.div>

            {/* TOPIC BREAKDOWN */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="text-violet-500" size={20} />
                  Topic Breakdown
                </h3>
                <span className="text-xs font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-3 py-1 rounded-full">
                  {stats.total} Total Topics
                </span>
              </div>
              
              <div className="space-y-4">
                {visibleTopics.length > 0 ? (
                  <>
                    {visibleTopics.map((topic: any) => {
                      const theoryWidth = topic.theoryCompleted || topic.isRead ? 100 : 0;
                      
                      // Using true data fetched from the backend dashboard endpoint
                      const totalQ = topic.totalQuestions || 0;
                      const solvedQ = topic.solvedQuestions || 0;
                      const quizWidth = totalQ > 0 ? Math.round((solvedQ / totalQ) * 100) : 0;

                      return (
                        <div key={topic._id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:shadow-md transition-all group">
                          <div className="flex justify-between items-center mb-5">
                            <span className="font-black text-slate-800 dark:text-slate-200 text-lg group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              {topic.title}
                            </span>
                            <button 
                              onClick={() => navigate(`/config/${topic._id}`)}
                              className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-bold flex items-center transition-colors bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg group-hover:bg-violet-50 dark:group-hover:bg-violet-900/20"
                            >
                              Practice <ChevronRight size={16} className="ml-1" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                                <span>Theory Progress</span>
                                <span className={theoryWidth === 100 ? "text-emerald-500" : ""}>{theoryWidth}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${theoryWidth}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                                <span>Quiz Accuracy</span>
                                <span className={quizWidth >= 80 ? "text-violet-500" : ""}>{quizWidth}% ({solvedQ}/{totalQ})</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
                                <div className="h-full bg-violet-500 rounded-full z-10 transition-all duration-1000" style={{ width: `${quizWidth}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <AnimatePresence>
                      {visibleCount < displayTopics.length && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-2 flex justify-center">
                          <button
                            onClick={() => setVisibleCount(prev => prev + 4)}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                          >
                            Show More Topics <ChevronDown size={16} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Inbox size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No topics available yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* LIVE CHALLENGES */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="text-amber-500" size={20} />
                  Live Challenges
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
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-500 mb-3">No active rooms right now.</p>
                    <button 
                      onClick={() => navigate('/peer-quiz')}
                      className="px-4 py-2 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-lg text-xs font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    >
                      Host one yourself!
                    </button>
                  </div>
                ) : (
                  activeRooms.slice(0, 3).map(room => (
                    <div key={room._id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate pr-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {room.topicId?.title || "Custom Quiz"}
                        </p>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg shrink-0 border border-slate-200 dark:border-slate-600">
                          {room.code}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {room.hostId?.name || "Peer"}
                        </p>
                        <button 
                          onClick={() => navigate(`/peer-quiz?join=${room.code}`)}
                          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <Play size={12} fill="currentColor" /> Join
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* COHORT LEADERS */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <Trophy className="text-amber-500" size={20} />
                Top 3 Leaders
              </h3>
              <div className="space-y-3">
                {leaders.length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Trophy size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-500">No scores recorded yet.</p>
                  </div>
                ) : (
                  leaders.map((leader, index) => {
                    const rank = index + 1;
                    return (
                      <div key={leader.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                            rank === 1 ? 'bg-linear-to-br from-amber-300 to-amber-500 text-white' : 
                            rank === 2 ? 'bg-linear-to-br from-slate-300 to-slate-400 text-white' : 
                            'bg-linear-to-br from-orange-300 to-orange-500 text-white'
                          }`}>
                            #{rank}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                              {leader.name} {leader.id === user?._id && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">You</span>}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              {leader.points} Points
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div className="pt-4 mt-2">
                  <button 
                    onClick={() => navigate('/leaderboard')}
                    className="w-full py-3 text-center text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    View Full Leaderboard
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
        <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight truncate">{value}</p>
      <div className="text-xs font-bold text-slate-500">{subtitle}</div>
    </div>
  );
}