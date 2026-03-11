import { useState, useEffect } from "react";
import { 
  Trophy, 
  Medal, 
  Search,
  Zap,
  Crown,
  Loader2,
  Globe,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useCohort } from "../context/CohortContext";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export default function LeaderboardPage() {
  const { user } = useUser();
  const { activeCohort } = useCohort();
  
  const [viewMode, setViewMode] = useState<"global" | "cohort">("global");
  const [rankings, setRankings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const endpoint = viewMode === "global" 
          ? `${API_URL}/api/leaderboard/global`
          : `${API_URL}/api/leaderboard/cohort/${encodeURIComponent(activeCohort)}`;
          
        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (data.success) {
          setRankings(data.data);
        }
      } catch (error) {
        console.error(`Failed to fetch ${viewMode} leaderboard:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [viewMode, activeCohort]);

  // Filter based on search query
  const filteredRankings = rankings.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = filteredRankings.slice(0, 3);
  const others = filteredRankings.slice(3);

  return (
    <div className="mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
          {viewMode === "global" ? "Global" : "Cohort"} <span className="text-blue-600">Standings</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
          {viewMode === "global" 
            ? "Top performers across the entire platform." 
            : `Top performers exclusively in the ${activeCohort} cohort.`}
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl inline-flex gap-1 shadow-inner">
          <button
            onClick={() => setViewMode("global")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              viewMode === "global" 
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Globe size={18} /> Global
          </button>
          <button
            onClick={() => setViewMode("cohort")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              viewMode === "cohort" 
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Users size={18} /> My Cohort
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-500">
          <Loader2 className="animate-spin mb-4" size={40} />
          <h2 className="font-bold text-lg">Calculating Rankings...</h2>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Podium Section */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
                {/* Silver - Rank 2 */}
                {topThree[1] && <PodiumCard user={topThree[1]} rank={2} color="bg-slate-200 dark:bg-slate-700" />}
                
                {/* Gold - Rank 1 */}
                {topThree[0] && (
                  <div className="relative order-first md:order-0">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500">
                      <Crown size={40} fill="currentColor" />
                    </div>
                    <PodiumCard user={topThree[0]} rank={1} color="bg-yellow-500" isGold />
                  </div>
                )}

                {/* Bronze - Rank 3 */}
                {topThree[2] && <PodiumCard user={topThree[2]} rank={3} color="bg-orange-300 dark:bg-orange-900/40" />}
              </div>
            )}

            {/* Search & List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Search className="text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder={`Search ${viewMode === 'global' ? 'any peer' : 'cohort peers'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {others.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-bold">
                          No other participants found.
                        </td>
                      </tr>
                    ) : (
                      others.map((u) => (
                        <tr 
                          key={u.id} 
                          className={`${u.id === user?._id ? "bg-blue-50/50 dark:bg-blue-900/10" : ""} hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors`}
                        >
                          <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">#{u.rank}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {u.name} {u.id === user?._id && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-blue-600 dark:text-blue-400">
                            {u.points.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// --- Sub-Component: Podium Card ---
function PodiumCard({ user, rank, color, isGold }: any) {
  return (
    <div className={`p-6 rounded-3xl text-center ${isGold ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40 py-10' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800'}`}>
      <div className="relative inline-block mb-4">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-2xl font-black text-slate-400">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white border-4 ${isGold ? 'border-blue-600' : 'border-white dark:border-slate-900'} ${color}`}>
          {rank === 1 ? <Trophy size={14} /> : <Medal size={14} />}
        </div>
      </div>
      <h3 className={`font-black truncate ${isGold ? 'text-xl' : 'text-slate-900 dark:text-white'}`}>{user.name}</h3>
      <div className={`flex items-center justify-center gap-1 mt-1 font-bold ${isGold ? 'text-blue-100' : 'text-slate-400'}`}>
        <Zap size={14} />
        <span>{user.points.toLocaleString()} pts</span>
      </div>
    </div>
  );
}