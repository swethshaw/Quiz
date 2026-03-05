import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  ShieldAlert,
  Copy,
  Link as LinkIcon,
  Mail,
  CheckCircle2,
  User,
  Loader2,
  MonitorOff,
  Maximize,
  Clock,
  HelpCircle,
  BarChart,
  Layers,
  Trash2,
  Info,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";

export default function QuizLobbyPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { cohortData, activeCohort, isLoading } = useCohort();
  const currentTopics = cohortData[activeCohort] || [];
  const topicInfo = currentTopics.find((t) => t._id === topicId);
  const {
    playMode = "individual",
    subMode = "test",
    timer = "30",
    difficulty = "Mix",
    selectedSubTopics = [],
    isAllTopics = true,
    generatedQuestions = [],
    roomCode = null,
    demoRoleOverride,
  } = location.state || {};
  const role = demoRoleOverride || (roomCode ? "host" : "player");
  const activeRoomCode =
    roomCode || new URLSearchParams(location.search).get("code");

  const [isHostTakingQuiz, setIsHostTakingQuiz] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(
    playMode === "individual" ? 30 : null,
  );
  const [lobbyStatus, setLobbyStatus] = useState<"waiting" | "starting">(
    "waiting",
  );
  const [hasMultipleDisplays, setHasMultipleDisplays] = useState(false);
  const [liveParticipants, setLiveParticipants] = useState<any[]>([]);
  const [isKicked, setIsKicked] = useState(false);
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);
  useEffect(() => {
    const checkDisplays = () => {
      if (window.screen && (window.screen as any).isExtended)
        setHasMultipleDisplays(true);
      else setHasMultipleDisplays(false);
    };
    checkDisplays();
    window.addEventListener("resize", checkDisplays);
    return () => window.removeEventListener("resize", checkDisplays);
  }, []);
  useEffect(() => {
    if (role === "participant" && activeRoomCode && user) {
      fetch(`http://localhost:5000/api/rooms/join/${activeRoomCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, name: user.name }),
      }).catch(console.error);
    }
  }, [role, activeRoomCode, user]);
  useEffect(() => {
    if (role === "host" && activeRoomCode && user) {
      if (isHostTakingQuiz) {
        fetch(`http://localhost:5000/api/rooms/join/${activeRoomCode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id, name: user.name }),
        }).catch(console.error);
      } else {
        fetch(`http://localhost:5000/api/rooms/host-action/${activeRoomCode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "kick", targetUserId: user._id }),
        }).catch(console.error);
      }
    }
  }, [isHostTakingQuiz, role, activeRoomCode, user]);
  useEffect(() => {
    if (playMode !== "multi" || !activeRoomCode || !user) return;

    const pollRoom = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/rooms/${activeRoomCode}`,
        );
        const data = await res.json();

        if (data.success) {
          setLiveParticipants(data.data.participants);
          if (
            role === "participant" &&
            data.data.status === "playing" &&
            lobbyStatus === "waiting"
          ) {
            setLobbyStatus("starting");
            setCountdown(3);
          }
          if (
            role === "participant" &&
            !data.data.participants.find((p: any) => p.userId === user._id)
          ) {
            setIsKicked(true);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    pollRoom();
    const interval = setInterval(pollRoom, 2000);
    return () => clearInterval(interval);
  }, [playMode, activeRoomCode, user, role, lobbyStatus]);

  useEffect(() => {
    if (isKicked) {
      alert("You have been removed from the lobby by the host.");
      navigate("/");
    }
  }, [isKicked, navigate]);

  const handleKickParticipant = async (targetUserId: string) => {
    await fetch(
      `http://localhost:5000/api/rooms/host-action/${activeRoomCode}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kick", targetUserId }),
      },
    );
  };

  const handleHostStart = async () => {
    if (hasMultipleDisplays) return;
    await fetch(
      `http://localhost:5000/api/rooms/host-action/${activeRoomCode}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      },
    );
    setLobbyStatus("starting");
    setCountdown(5);
  };

  const handleManualStart = () => {
    if (hasMultipleDisplays) return;
    navigate(`/quiz/${topicId}`, {
      state: {
        ...location.state,
        role: playMode === "individual" ? "player" : role,
        isHostTakingQuiz,
      },
    });
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (role === "host" && !isHostTakingQuiz) {
        navigate(`/proctor/${activeRoomCode}`);
      } else {
        navigate(`/quiz/${topicId}`, { state: { ...location.state, role } });
      }
      return;
    }
    const timerInterval = setInterval(
      () => setCountdown((p) => (p !== null ? p - 1 : null)),
      1000,
    );
    return () => clearInterval(timerInterval);
  }, [
    countdown,
    navigate,
    topicId,
    location.state,
    role,
    isHostTakingQuiz,
    activeRoomCode,
  ]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeRoomCode);
    alert("Code Copied!");
  };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/peer?join=${activeRoomCode}`,
    );
    alert("Link Copied!");
  };
  const handleEmail = () => {
    window.open(
      `mailto:?subject=Join my Quiz Session&body=Hey! Join my live quiz session. Code: ${activeRoomCode}`,
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
        <p className="text-xl font-bold text-slate-500">
          Loading Lobby Environment...
        </p>
      </div>
    );
  }

  if (!topicInfo || generatedQuestions.length === 0) {
    return (
      <div className="p-8 text-center font-bold text-slate-500">
        Paper Initialization Failed. Please return to Config.
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                {topicInfo.title}
              </h1>
              <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-sm font-bold uppercase tracking-wider w-max">
                {subMode} Mode
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
                <Clock className="text-slate-400 mb-1" size={18} />
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Time
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {timer === "No Limit" ? "No Limit" : `${timer} mins`}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
                <HelpCircle className="text-slate-400 mb-1" size={18} />
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Qs
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {generatedQuestions.length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
                <BarChart className="text-slate-400 mb-1" size={18} />
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Diff
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {difficulty}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1 overflow-hidden">
                <Layers className="text-slate-400 mb-1 shrink-0" size={18} />
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Topics
                </span>
                <span
                  className="font-bold text-slate-900 dark:text-white text-sm truncate"
                  title={
                    isAllTopics ? "All Topics" : selectedSubTopics.join(", ")
                  }
                >
                  {isAllTopics ? "All Topics" : selectedSubTopics.join(", ")}
                </span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-3">
                <Info size={18} className="text-blue-600 dark:text-blue-400" />{" "}
                General Instructions
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 ml-6 list-disc">
                <li>
                  Read each question carefully before selecting an option.
                </li>
                <li>
                  You can use the <strong>"Mark for Review"</strong> button to
                  easily revisit tough questions later.
                </li>
                <li>
                  You must submit the quiz manually when finished, otherwise it
                  will auto-submit when the timer expires.
                </li>
              </ul>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-800 shadow-sm">
              <h3 className="font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-3">
                <Lightbulb
                  size={18}
                  className="text-purple-600 dark:text-purple-400"
                />{" "}
                Tips for Success
              </h3>
              <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-2 ml-6 list-disc">
                <li>
                  Do not spend too much time on a single question. Skip it and
                  come back later.
                </li>
                <li>
                  Use the elimination method to narrow down multiple-choice
                  options.
                </li>
                <li>
                  Always double-check your skipped and marked questions using
                  the side palette before submitting.
                </li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-800 shadow-sm">
              <h3 className="font-bold text-red-900 dark:text-red-100 flex items-center gap-2 mb-3">
                <ShieldAlert
                  size={18}
                  className="text-red-600 dark:text-red-400"
                />{" "}
                Proctoring & Security Rules
              </h3>
              <ul className="text-sm text-red-800 dark:text-red-300 space-y-2 ml-6 list-disc">
                <li>
                  <strong>Fullscreen Locked:</strong> You are forced into
                  fullscreen mode. Exiting will trigger a strike.
                </li>
                <li>
                  <strong>Tab Switching:</strong> Navigating away from the quiz
                  tab is tracked. Receiving 3 strikes will force
                  auto-submission.
                </li>
                <li>
                  <strong>Single Display:</strong> Using multiple monitors is
                  strictly prohibited and will prevent you from starting.
                </li>
                <li>
                  <strong>Right Click Disabled:</strong> Copy-pasting
                  functionality has been disabled to protect quiz integrity.
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden min-h-100"
          >
            <AnimatePresence>
              {lobbyStatus === "starting" && countdown !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-20 bg-blue-600 flex flex-col items-center justify-center text-white"
                >
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-8xl font-black mb-4"
                  >
                    {countdown}
                  </motion.div>
                  <p className="text-xl font-bold opacity-80 animate-pulse">
                    Quiz starting...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {hasMultipleDisplays && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-4 mb-6 text-center animate-pulse">
                <MonitorOff size={32} className="mx-auto text-red-500 mb-2" />
                <p className="font-bold text-red-800 dark:text-red-300">
                  Multiple Displays Detected
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Please disconnect your secondary monitor to start the quiz.
                </p>
              </div>
            )}
            {playMode === "individual" && (
              <div className="text-center py-2">
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-6">
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="transparent"
                      strokeWidth="6"
                      className="stroke-slate-100 dark:stroke-slate-800"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="transparent"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="stroke-blue-500 transition-all duration-1000 ease-linear"
                      strokeDasharray={289}
                      strokeDashoffset={289 - 289 * ((countdown || 0) / 30)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-blue-600 dark:text-blue-400">
                      {countdown}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Secs
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Starting Automatically
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-4">
                  Review the session details and rules. Click below to enter
                  fullscreen immediately.
                </p>
                <button
                  onClick={handleManualStart}
                  disabled={hasMultipleDisplays}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2"
                >
                  <Maximize size={20} /> Start Immediately
                </button>
              </div>
            )}
            {playMode === "multi" && role === "host" && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="text-blue-500" /> Live Lobby
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6 text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Room Code
                  </p>
                  <p className="text-4xl font-black tracking-widest text-slate-900 dark:text-white mb-3">
                    {activeRoomCode}
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-slate-600 hover:text-blue-600 transition-colors"
                      title="Copy Code"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-slate-600 hover:text-blue-600 transition-colors"
                      title="Copy Link"
                    >
                      <LinkIcon size={16} />
                    </button>
                    <button
                      onClick={handleEmail}
                      className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-slate-600 hover:text-blue-600 transition-colors"
                      title="Email Invite"
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Participants ({liveParticipants.length})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {liveParticipants.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">
                        Waiting for others to join...
                      </p>
                    ) : null}
                    {liveParticipants.map((p) => (
                      <div
                        key={p.userId}
                        className="flex justify-between items-center text-sm p-3 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg shadow-sm group"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-500" />{" "}
                          {p.name}{" "}
                          {p.userId === user?._id && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">
                              Host
                            </span>
                          )}
                        </span>
                        {p.userId !== user?._id && (
                          <button
                            onClick={() => handleKickParticipant(p.userId)}
                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-xl mb-6 cursor-pointer hover:bg-blue-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isHostTakingQuiz}
                    onChange={(e) => setIsHostTakingQuiz(e.target.checked)}
                    className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-sm">
                    <p className="font-bold text-slate-900 dark:text-white">
                      I am also participating
                    </p>
                    <p className="text-slate-500">
                      Uncheck to access the Proctoring Dashboard instead.
                    </p>
                  </div>
                </label>

                <button
                  onClick={handleHostStart}
                  disabled={hasMultipleDisplays}
                  className="w-full py-4 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Maximize size={20} /> Start Quiz for All
                </button>
              </div>
            )}
            {playMode === "multi" && role === "participant" && (
              <div className="text-center py-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 border-4 border-blue-100">
                  <User size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  You're in the Lobby!
                </h3>
                <p className="text-slate-500 text-sm mb-8 px-2">
                  Please wait for the host to start the quiz.
                </p>

                <div className="flex items-center gap-3 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold animate-pulse shadow-inner">
                  <Loader2 size={20} className="animate-spin text-blue-500" />{" "}
                  Waiting for Host...
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
