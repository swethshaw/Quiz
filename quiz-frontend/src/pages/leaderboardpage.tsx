import { useMemo } from "react";
import { 
  Trophy, 
  Medal, 
  ChevronUp, 
  ChevronDown, 
  Search,
  Zap,
  Crown
} from "lucide-react";
import { motion } from "framer-motion";
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";

// --- DUMMY DATA ---
const LEADERBOARD_DATA = [
  { id: "u1", name: "Arjun Sharma", points: 2850, rank: 1, trend: "up", cohort: "Full Stack Development", avatar: "" },
  { id: "u2", name: "Sanya Malhotra", points: 2720, rank: 2, trend: "up", cohort: "Full Stack Development", avatar: "" },
  { id: "u3", name: "Rahul Verma", points: 2600, rank: 3, trend: "down", cohort: "Full Stack Development", avatar: "" },
  { id: "u4", name: "Priya Singh", points: 2450, rank: 4, trend: "same", cohort: "Full Stack Development", avatar: "" },
  { id: "u5", name: "You", points: 2100, rank: 12, trend: "up", cohort: "Full Stack Development", avatar: "" }, // The Current User
  { id: "u6", name: "Amit Patel", points: 2900, rank: 1, trend: "up", cohort: "Full Stack Development", avatar: "" },
];

export default function LeaderboardPage() {
  const { activeCohort } = useCohort();
  const { user } = useUser();

  // Filter and Sort data by points
  const cohortRankings = useMemo(() => {
    return LEADERBOARD_DATA
      .filter(u => u.cohort === activeCohort)
      .sort((a, b) => b.points - a.points);
  }, [activeCohort]);

  const topThree = cohortRankings.slice(0, 3);
  const others = cohortRankings.slice(3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-3">
          Community <span className="text-blue-600">Standings</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Top performers in the <span className="font-bold text-slate-900 dark:text-slate-200">{activeCohort}</span> cohort
        </p>
      </div>

      {/* Podium Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
        {/* Silver - Rank 2 */}
        {topThree[1] && <PodiumCard user={topThree[1]} rank={2} color="bg-slate-200 dark:bg-slate-700" />}
        
        {/* Gold - Rank 1 */}
        {topThree[0] && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="relative order-first md:order-0"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500">
              <Crown size={40} fill="currentColor" />
            </div>
            <PodiumCard user={topThree[0]} rank={1} color="bg-yellow-500" isGold />
          </motion.div>
        )}

        {/* Bronze - Rank 3 */}
        {topThree[2] && <PodiumCard user={topThree[2]} rank={3} color="bg-orange-300 dark:bg-orange-900/40" />}
      </div>

      {/* Search & List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search peer name..." 
            className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Trend</th>
                <th className="px-6 py-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {others.map((u) => (
                <tr 
                  key={u.id} 
                  className={`${u.name === "You" ? "bg-blue-50/50 dark:bg-blue-900/10" : ""} hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors`}
                >
                  <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">#{u.rank}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                        {u.name[0]}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.trend === "up" ? <ChevronUp className="text-emerald-500" size={18} /> : <ChevronDown className="text-red-500" size={18} />}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-blue-600 dark:text-blue-400">{u.points.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component: Podium Card ---

function PodiumCard({ user, rank, color, isGold }: any) {
  return (
    <div className={`p-6 rounded-3xl text-center ${isGold ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40 py-10' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800'}`}>
      <div className="relative inline-block mb-4">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-2xl font-black text-slate-400">
          {user.name[0]}
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