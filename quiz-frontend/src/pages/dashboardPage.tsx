import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
Trophy,ChevronRight, CalendarDays, Flame,
  Zap, ChevronDown
} from 'lucide-react';
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";

// --- DUMMY "UP NEXT" DATA ---
const UPCOMING_TASKS = [
  { id: 101, title: "Weekly Peer Challenge", type: "Quiz Battle", time: "Tomorrow, 6 PM" },
  { id: 102, title: "System Design Setup", type: "Reading", time: "Due in 2 days" }
];

export default function Dashboard() {
  const { activeCohort, cohortData, isLoading, refreshData } = useCohort();
  const { user } = useUser();

  // 1. Pagination State for Topics
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    refreshData();
    // Reset the visible topics count back to 4 whenever the user switches cohorts
    setVisibleCount(4);
  }, [refreshData, activeCohort]);

  const currentTopics = useMemo(() => cohortData[activeCohort] || [], [cohortData, activeCohort]);

  // Apply the slice based on the visibleCount state
  const visibleTopics = useMemo(() => currentTopics.slice(0, visibleCount), [currentTopics, visibleCount]);

  const stats = useMemo(() => {
    const total = currentTopics.length;
    const theoryCompleted = currentTopics.filter((t: any) => t.theoryCompleted || t.isRead).length;
    const quizzesDone = currentTopics.filter((t: any) => t.quizTaken || (t.quizScore && t.quizScore > 0)).length;
    
    const avgQuizScore = total > 0 
      ? Math.round(currentTopics.reduce((acc: number, t: any) => acc + (t.quizScore || 0), 0) / total) 
      : 0;

    return { total, theoryCompleted, quizzesDone, avgQuizScore, streak: 5, rank: 12 };
  }, [currentTopics]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE] dark:bg-[#0B0F19]">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 p-4 md:p-8 font-sans overflow-x-hidden">
      
      {/* 1. WELCOME BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-r from-violet-600 to-indigo-500 rounded-3xl p-8 mb-8 text-white shadow-lg shadow-violet-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-violet-100 text-xs font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <Zap size={14} className="text-yellow-300" /> 
              {stats.streak} Day Streak
            </p>
            <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
              Welcome, {user?.name?.split(' ')[0] || "Student"}!
            </h2>
            <p className="text-violet-100 max-w-xl font-medium">
              You are exploring the <span className="font-bold text-white">{activeCohort}</span> track. 
              Currently ranked #{stats.rank} among your peers.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="bg-white text-violet-700 px-6 py-2.5 rounded-xl font-bold hover:bg-violet-50 transition-colors shadow-sm text-sm">
              Resume Learning
            </button>
            <button className="bg-violet-800/50 backdrop-blur text-white px-6 py-2.5 rounded-xl font-bold hover:bg-violet-800/70 transition-colors border border-violet-400/30 text-sm">
              Peer Challenge
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. QUICK STATS */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <StatCard title="Theory Modules" value={`${stats.theoryCompleted}/${stats.total}`} subtitle="Completed" />
        <StatCard title="Quiz Accuracy" value={`${stats.avgQuizScore}%`} subtitle="Average Score" />
        <StatCard title="Quizzes Taken" value={`${stats.quizzesDone}/${stats.total}`} subtitle="Attempted" />
        <StatCard title="Cohort Rank" value={`#${stats.rank}`} subtitle={<span className="flex items-center gap-1 text-orange-500"><Flame size={12}/> Top 15%</span>} />
      </motion.div>

      {/* 3. MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Topic Progress & Heatmap */}
        <div className="lg:col-span-2 space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Activity Heatmap</h3>
                <p className="text-sm text-slate-500">Modules & quizzes completed this month</p>
              </div>
              <CalendarDays className="text-slate-400" />
            </div>
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 36 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-md ${
                    Math.random() > 0.8 ? 'bg-violet-600' : 
                    Math.random() > 0.6 ? 'bg-violet-400' : 
                    Math.random() > 0.4 ? 'bg-violet-200 dark:bg-violet-900/40' : 
                    'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Subject-wise Breakdown / Topic Progress */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Topic-wise Breakdown</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {stats.total} Total Topics
              </span>
            </div>
            
            <div className="space-y-6">
              {visibleTopics.length > 0 ? (
                <>
                  {/* Map only over the sliced visibleTopics array */}
                  {visibleTopics.map((topic: any) => {
                    const theoryWidth = topic.theoryCompleted || topic.isRead ? 100 : 0;
                    const quizWidth = topic.quizScore || 0;
                    const peerAvg = 65; 

                    return (
                      <div key={topic._id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 group hover:border-violet-200 dark:hover:border-violet-900/50 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {topic.title}
                          </span>
                          <button className="text-violet-600 text-sm font-bold hover:underline flex items-center">
                            Review <ChevronRight size={16} />
                          </button>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                            <span>Theory (LMS)</span>
                            <span className={theoryWidth === 100 ? "text-blue-500" : ""}>{theoryWidth}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${theoryWidth}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                            <span>Practice (Quiz)</span>
                            <span>{quizWidth}% <span className="text-slate-400 font-normal ml-2 hidden sm:inline">Peer Avg: {peerAvg}%</span></span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex relative">
                            <div className="h-full bg-violet-500 rounded-full z-10 transition-all duration-1000" style={{ width: `${quizWidth}%` }} />
                            <div className="absolute top-0 bottom-0 bg-slate-800 dark:bg-slate-300 w-1 rounded-full z-20" style={{ left: `${peerAvg}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* SHOW MORE BUTTON */}
                  {visibleCount < currentTopics.length && (
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={() => setVisibleCount(prev => prev + 4)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 font-bold text-sm rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors border border-violet-100 dark:border-violet-800/50"
                      >
                        Show More Topics <ChevronDown size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4 font-medium">No topics available for this cohort.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Peer Elements & Upcoming */}
        <div className="space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Up Next</h3>
            <div className="space-y-3">
              {UPCOMING_TASKS.map(task => (
                <div key={task.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{task.title}</p>
                    <span className="px-2 py-1 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-[10px] font-black uppercase rounded-lg">
                      {task.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs font-bold text-slate-500">{task.time}</p>
                    <button className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors">
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <Trophy className="text-amber-500" size={20} />
              Cohort Leaders
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((rank) => (
                <div key={rank} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      rank === 1 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                      rank === 2 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : 
                      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {rank}
                    </div>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Student_{rank}0{rank}</span>
                  </div>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-md">
                    {100 - (rank * 2)}% Avg
                  </span>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button className="w-full text-center text-sm font-bold text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  View Full Leaderboard
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
      <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{value}</p>
      <div className="text-xs font-bold text-slate-400">{subtitle}</div>
    </div>
  );
}