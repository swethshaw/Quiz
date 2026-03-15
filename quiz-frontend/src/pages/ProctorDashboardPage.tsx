import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Users,
  StopCircle,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Activity,
  AlertOctagon,
  Trophy,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// Connect to the socket server
const socket = io(API_URL);

export default function ProctorDashboardPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [roomData, setRoomData] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isEndingRef = useRef(false);

  // Initial Fetch & Real-Time Socket Setup
  useEffect(() => {
    if (!user || !roomCode) return;

    // 1. Fetch initial state once
    const fetchInitialData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/rooms/${roomCode}`);
        const data = await res.json();

        if (data.success) {
          setRoomData(data.data);
          let parts = [...data.data.participants];

          if (data.data.status === "finished") {
            parts.sort(
              (a, b) =>
                b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds,
            );
          }
          setParticipants(parts);
        }
      } catch (err) {
        console.error("Failed to fetch initial room data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // 2. Setup Socket Connection for Live Updates
    socket.emit("join_room", roomCode);

    // Listen for live student updates (Warnings, Progress, Submissions)
    socket.on("update_proctor_view", (data: any) => {
      setParticipants((prev) => {
        const newParts = [...prev];
        const pIndex = newParts.findIndex((p) => p.userId === data.userId);

        if (pIndex > -1) {
          if (data.type === "warning") {
            newParts[pIndex].warnings = data.count;
          } else if (data.type === "progress") {
            newParts[pIndex].score = data.currentScore;
          } else if (data.type === "submit") {
            newParts[pIndex].status = "Submitted";
            newParts[pIndex].score = data.finalScore;
            newParts[pIndex].timeSpentSeconds = data.timeSpentSeconds;
          }
        }
        return newParts;
      });
    });

    // Cleanup listeners
    return () => {
      socket.off("update_proctor_view");
    };
  }, [roomCode, user]);

  // Host Actions (Kick/Block/End) - Wrapped in useCallback for safe dependency usage
  const handleHostAction = useCallback(
    async (action: "kick" | "block" | "end", targetUserId?: string) => {
      // 1. Optimistic UI Update
      if (action === "block" || action === "kick") {
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === targetUserId
              ? {
                  ...p,
                  status: action === "block" ? "Blocked" : "Kicked",
                  _isProcessing: true,
                }
              : p,
          ),
        );
      }

      try {
        // 2. Update Database
        const res = await fetch(
          `${API_URL}/api/rooms/host-action/${roomCode}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, targetUserId }),
          },
        );
        const data = await res.json();

        if (action === "end" && data.success) {
          setRoomData(data.data);
          // Sort final leaderboard locally since it ended
          setParticipants((prev) =>
            [...prev].sort(
              (a, b) =>
                b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds,
            ),
          );
        }

        // 3. Emit Socket event to force immediate action on student's screen
        socket.emit("host_action", { roomCode, action, targetUserId });
      } catch (err) {
        console.error(`Failed to ${action} user`, err);
      }
    },
    [roomCode],
  );

  // AUTO-END QUIZ LOGIC: Automatically triggers if all users submit
  useEffect(() => {
    if (!roomData || isEndingRef.current || roomData.status === "finished")
      return;

    const stillActiveCount = participants.filter(
      (p) => p.status === "Joined" || p.status === "Playing",
    ).length;

    // If there are participants, and none are active anymore, trigger end!
    if (
      participants.length > 0 &&
      stillActiveCount === 0 &&
      !isEndingRef.current
    ) {
      isEndingRef.current = true;
      handleHostAction("end");
    }
  }, [participants, roomData, handleHostAction]);

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  if (isLoading)
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );

  if (!roomData)
    return (
      <div className="p-8 text-center font-bold text-slate-500">
        Room not found.
      </div>
    );

  const isFinished = roomData.status === "finished";
  const activeCount = participants.filter(
    (p) => p.status === "Playing" || p.status === "Joined",
  ).length;
  const submittedCount = participants.filter(
    (p) => p.status === "Submitted",
  ).length;
  const blockedCount = participants.filter(
    (p) => p.status === "Blocked",
  ).length;
  const totalWarnings = participants.reduce(
    (acc, p) => acc + (p.warnings || 0),
    0,
  );
  const allParticipantsDone = participants.length > 0 && activeCount === 0;

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate("/results")}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Results
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              {isFinished ? (
                <Trophy className="text-purple-500" size={32} />
              ) : (
                <Activity className="text-blue-500" size={32} />
              )}
              {isFinished ? "Proctor Report" : "Live Proctoring"}
            </h1>
            <span
              className={`px-3 py-1 font-bold text-xs uppercase tracking-widest rounded-full flex items-center gap-1 ${isFinished ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse"}`}
            >
              {!isFinished && (
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              )}
              {isFinished ? "Ended" : "LIVE"}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Room{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              {roomCode}
            </strong>{" "}
            • {roomData.topicId?.title}
          </p>
        </div>
        {!isFinished && !allParticipantsDone && (
          <button
            onClick={() => {
              isEndingRef.current = true;
              handleHostAction("end");
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-colors"
          >
            <StopCircle size={20} /> End Quiz for All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {participants.length}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Students
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {activeCount}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase">Active</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {submittedCount + blockedCount}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Submitted
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden">
          {totalWarnings > 0 && (
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
          )}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${totalWarnings > 0 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" : "bg-slate-50 text-slate-400 dark:bg-slate-800"}`}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalWarnings}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Warnings
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-100">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          {isFinished
            ? "Final Leaderboard & Report"
            : "Participant Status Feed"}
        </h3>

        {participants.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-bold">
            No participants joined this session.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {participants.map((p, i) => (
                <motion.div
                  key={p.userId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                    p.status === "Blocked"
                      ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10"
                      : p.status === "Submitted"
                        ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10"
                        : p.warnings > 0
                          ? "border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10"
                          : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-800/50"
                  }`}
                >
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${p.status === "Blocked" ? "bg-red-500" : p.status === "Submitted" ? "bg-green-500" : p.status === "Playing" ? "bg-blue-500" : "bg-slate-300"}`}
                  ></div>

                  <div>
                    <div className="flex justify-between items-start mb-4 mt-1">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                          {isFinished &&
                            (i === 0 ? (
                              "🥇"
                            ) : i === 1 ? (
                              "🥈"
                            ) : i === 2 ? (
                              "🥉"
                            ) : (
                              <span className="text-slate-400 text-sm">
                                {i + 1}.
                              </span>
                            ))}
                          {p.name}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">
                          {p.status}
                        </p>
                      </div>
                      {p.warnings > 0 && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-md border border-orange-200">
                          <ShieldAlert size={12} /> {p.warnings} Warns
                        </span>
                      )}
                    </div>

                    <div className="mt-2 mb-2 p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block">
                          Current Score
                        </span>
                        <span className="font-black text-xl text-slate-900 dark:text-white">
                          {p.score || 0}{" "}
                          <span className="text-sm font-bold text-slate-500">
                            pts
                          </span>
                        </span>
                      </div>
                      {(p.status === "Submitted" ||
                        p.status === "Blocked" ||
                        isFinished) && (
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-500 uppercase block">
                            Time
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {formatTime(p.timeSpentSeconds || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isFinished && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                      <button
                        onClick={() => handleHostAction("block", p.userId)}
                        disabled={
                          p.status === "Blocked" ||
                          p.status === "Submitted" ||
                          p._isProcessing
                        }
                        className="flex-1 py-2 bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <AlertOctagon size={14} /> Force Submit
                      </button>
                      <button
                        onClick={() => handleHostAction("kick", p.userId)}
                        disabled={
                          p.status === "Blocked" ||
                          p.status === "Submitted" ||
                          p._isProcessing
                        }
                        className="flex-1 py-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UserX size={14} /> Kick
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
