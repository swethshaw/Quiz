import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  LogIn,
  Hash,
  ArrowRight,
  Clock,
  Mail,
  MonitorPlay,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";

export default function PeerQuizPage() {
  const navigate = useNavigate();
  const { activeCohort, cohortData } = useCohort();
  const { user } = useUser();
  const currentTopics = cohortData[activeCohort] || [];
  const [joinCode, setJoinCode] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [activeInvites, setActiveInvites] = useState<any[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (currentTopics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(currentTopics[0]._id);
    }
  }, [activeCohort, currentTopics, selectedTopicId]);

  useEffect(() => {
    const fetchActiveRooms = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/rooms/active");
        const data = await res.json();
        if (data.success) {
          setActiveInvites(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch active rooms", err);
      } finally {
        setIsLoadingInvites(false);
      }
    };
    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 10000);
    return () => clearInterval(interval);
  }, []);
  const handleJoinRoom = async (code: string) => {
    if (!code.trim() || !user) return;
    setIsJoining(true);
    setJoinError("");

    try {
      const res = await fetch(`http://localhost:5000/api/rooms/join/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, name: user.name }),
      });

      const data = await res.json();

      if (data.success) {
        navigate(`/lobby/${data.data.topicId._id}`, {
          state: {
            playMode: "multi",
            demoRoleOverride: "participant",
            roomCode: data.data.code,
            generatedQuestions: data.data.questions,
          },
        });
      } else {
        setJoinError(data.message || "Invalid Code");
      }
    } catch (err) {
      setJoinError("Failed to connect to server.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = () => {
    if (!selectedTopicId) return;
    navigate(`/config/${selectedTopicId}`, {
      state: { defaultPlayMode: "multi" },
    });
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(dateString).getTime()) / 1000,
    );
    if (seconds < 60) return `${seconds} secs ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    return `${Math.floor(minutes / 60)} hours ago`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold bg-linear-to-r from-blue-700 to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent mb-3 tracking-tight flex items-center gap-3">
          <Users className="text-blue-600 dark:text-blue-400" size={36} />
          Peer Quizzes ({activeCohort})
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-lg max-w-2xl">
          Compete with your cohort in real-time. Join an existing room using a
          code, or create your own challenge.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-400 to-blue-600"></div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <LogIn size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Join a Room
              </h2>
              <p className="text-sm text-slate-500">
                Enter a 6-digit invite code
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Hash className="text-slate-400" size={20} />
              </div>
              <input
                type="text"
                placeholder="e.g. X7F-9K2"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError("");
                }}
                maxLength={7}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 tracking-widest uppercase transition-colors"
              />
            </div>
            {joinError && (
              <p className="text-red-500 text-sm font-bold animate-pulse">
                {joinError}
              </p>
            )}

            <button
              onClick={() => handleJoinRoom(joinCode)}
              disabled={joinCode.length < 6 || isJoining}
              className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {isJoining ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Enter Lobby <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-purple-500/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-purple-400 to-purple-600"></div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Plus size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Create a Room
              </h2>
              <p className="text-sm text-slate-500">Host a live session</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full appearance-none pl-12 pr-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer transition-colors"
              >
                {currentTopics.length > 0 ? (
                  currentTopics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.title}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No topics available
                  </option>
                )}
              </select>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MonitorPlay className="text-slate-400" size={20} />
              </div>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={20}
              />
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={currentTopics.length === 0}
              className="w-full py-4 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2"
            >
              Configure Quiz <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <Mail className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Active Invitations
          </h2>
          <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-full">
            {isLoadingInvites ? "..." : activeInvites.length} Pending
          </span>
        </div>

        <div className="space-y-4">
          {isLoadingInvites ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : activeInvites.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
              No active rooms found right now. Create one above!
            </div>
          ) : (
            activeInvites.map((invite, index) => (
              <motion.div
                key={invite._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full ${invite.hostId.avatarColor || "bg-blue-500"} text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0`}
                  >
                    {invite.hostId.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">
                      <strong className="text-slate-900 dark:text-white">
                        {invite.hostId.name}
                      </strong>{" "}
                      invited you to play
                    </p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {invite.topicId.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center w-full md:w-auto justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t border-slate-200 dark:border-slate-700 md:border-none">
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Clock size={14} /> {getTimeAgo(invite.createdAt)}
                  </div>
                  <button
                    onClick={() => handleJoinRoom(invite.code)}
                    disabled={isJoining}
                    className="px-6 py-2.5 bg-white dark:bg-slate-900 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Accept & Join
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
