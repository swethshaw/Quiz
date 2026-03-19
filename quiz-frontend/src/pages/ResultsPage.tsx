import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Users,
  User,
  Loader2,
  ShieldCheck,
  Activity,
  ChevronRight,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useCohort } from "../context/CohortContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function ResultsPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { cohortData, activeCohort } = useCohort();

  const [activeTab, setActiveTab] = useState<"attempts" | "hosted">("attempts");
  const [results, setResults] = useState<any[]>([]);
  const [hostedRooms, setHostedRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const resResults = await fetch(
          `${API_URL}/api/results/user/${user._id}`,
        );
        const dataResults = await resResults.json();
        if (dataResults.success) setResults(dataResults.data);

        const resHosted = await fetch(
          `${API_URL}/api/rooms/hosted/${user._id}`,
        );
        const dataHosted = await resHosted.json();
        if (dataHosted.success) setHostedRooms(dataHosted.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const currentTopics = cohortData[activeCohort] || [];
  const validTopicIds = new Set(currentTopics.map((t) => t._id.toString()));

  const filteredResults = results.filter((r) => {
    const tId =
      typeof r.topicId === "string" ? r.topicId : r.topicId?._id?.toString();
    return validTopicIds.has(tId);
  });

  const filteredHostedRooms = hostedRooms.filter((room) => {
    const tId =
      typeof room.topicId === "string"
        ? room.topicId
        : room.topicId?._id?.toString();
    return validTopicIds.has(tId);
  });

  if (isLoading) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="font-bold text-slate-500">Loading History...</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-linear-to-r from-blue-700 to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            Your History
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review your past performance and sessions you've hosted in{" "}
            <strong className="text-blue-600 dark:text-blue-400">
              {activeCohort}
            </strong>
            .
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveTab("attempts")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "attempts" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <User size={16} /> My Attempts
          </button>
          <button
            onClick={() => setActiveTab("hosted")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "hosted" ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <ShieldCheck size={16} /> Hosted Sessions
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "attempts" && (
          <motion.div
            key="attempts"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-4"
          >
            {filteredResults.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 font-bold">
                  You haven't taken any {activeCohort} quizzes yet!
                </p>
              </div>
            ) : (
              filteredResults.map((result) => (
                <div
                  key={result._id}
                  onClick={() => navigate(`/results/${result._id}`)}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${result.playMode === "multi" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}
                      >
                        {result.playMode === "multi" ? (
                          <Users size={12} />
                        ) : (
                          <User size={12} />
                        )}{" "}
                        {result.playMode}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock size={12} />{" "}
                        {new Date(result.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {result.topicId?.title || "Assessment"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                        Score
                      </p>
                      <p
                        className={`text-2xl font-black ${result.percentage >= 70 ? "text-green-500" : "text-orange-500"}`}
                      >
                        {result.percentage}%
                      </p>
                    </div>
                    <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
        {activeTab === "hosted" && (
          <motion.div
            key="hosted"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            {filteredHostedRooms.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 font-bold">
                  You haven't hosted any {activeCohort} multiplayer sessions
                  yet!
                </p>
              </div>
            ) : (
              filteredHostedRooms.map((room) => {
                // Calculate if there are any active participants left
                const activeCount =
                  room.participants?.filter(
                    (p: any) => p.status === "Joined" || p.status === "Playing",
                  ).length || 0;

                // If room is manually finished, or if everyone who joined has submitted/been blocked
                const isRoomEnded =
                  room.status === "finished" ||
                  (room.participants?.length > 0 && activeCount === 0);

                return (
                  <div
                    key={room._id}
                    onClick={() => navigate(`/proctor/${room.code}`)}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isRoomEnded ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse"}`}
                        >
                          {isRoomEnded ? (
                            <ShieldCheck size={12} />
                          ) : (
                            <Activity size={12} />
                          )}
                          {isRoomEnded ? "Ended" : "Live"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock size={12} />{" "}
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {room.topicId?.title || "Assessment"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                          Room Code
                        </p>
                        <p className="text-xl font-black text-slate-700 dark:text-slate-300 tracking-widest">
                          {room.code}
                        </p>
                      </div>
                      <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
