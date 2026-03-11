import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  ShieldAlert,
  Copy,
  Link as LinkIcon,
  Mail,
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
  LogOut,
  XCircle,
  Check,
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
  const activeRoomCode = roomCode || new URLSearchParams(location.search).get("code");

  const [isHostTakingQuiz, setIsHostTakingQuiz] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(
    playMode === "individual" ? 30 : null,
  );
  const [lobbyStatus, setLobbyStatus] = useState<"waiting" | "starting">("waiting");
  const [hasMultipleDisplays, setHasMultipleDisplays] = useState(false);
  const [liveParticipants, setLiveParticipants] = useState<any[]>([]);
  const [isKicked, setIsKicked] = useState(false);
  const [hostLeft, setHostLeft] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isNavigatingToQuiz = useRef(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  useEffect(() => {
    const checkDisplays = () => {
      if (window.screen && (window.screen as any).isExtended) {
        setHasMultipleDisplays(true);
      } else {
        setHasMultipleDisplays(false);
      }
    };
    checkDisplays();
    window.addEventListener("resize", checkDisplays);
    return () => window.removeEventListener("resize", checkDisplays);
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      if (role === "host" && activeRoomCode) {
        navigator.sendBeacon(`http://localhost:5000/api/rooms/${activeRoomCode}/delete`);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (role === "host" && activeRoomCode && !isNavigatingToQuiz.current) {
        fetch(`http://localhost:5000/api/rooms/${activeRoomCode}`, { method: "DELETE" }).catch(console.error);
      }
    };
  }, [role, activeRoomCode]);

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
        const res = await fetch(`http://localhost:5000/api/rooms/${activeRoomCode}`);
        if (res.status === 404 || res.status === 410) {
          if (role === "participant" && lobbyStatus === "waiting") setHostLeft(true);
          return;
        }

        const data = await res.json();
        if (!data.success) {
          if (role === "participant" && lobbyStatus === "waiting") setHostLeft(true);
          return;
        }

        setLiveParticipants(data.data.participants);

        if (role === "participant" && data.data.status === "playing" && lobbyStatus === "waiting") {
          setLobbyStatus("starting");
          setCountdown(3);
        }

        if (role === "participant" && data.data.status !== "playing") {
          const amIStillHere = data.data.participants.find((p: any) => p.userId === user._id);
          if (!amIStillHere) setIsKicked(true);
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
    if (isKicked || hostLeft) {
      setTimeout(() => navigate("/"), 3000);
    }
  }, [isKicked, hostLeft, navigate]);

  const handleKickParticipant = async (targetUserId: string) => {
    await fetch(`http://localhost:5000/api/rooms/host-action/${activeRoomCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "kick", targetUserId }),
    });
  };

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
  };

  const handleHostStart = async () => {
    if (hasMultipleDisplays) return;
    isNavigatingToQuiz.current = true; 
    
    await fetch(`http://localhost:5000/api/rooms/host-action/${activeRoomCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    setLobbyStatus("starting");
    setCountdown(5);
  };

  const handleManualStart = () => {
    if (hasMultipleDisplays) return;
    enterFullScreen();
    navigate(`/quiz/${topicId}`, {
      state: { ...location.state, role: playMode === "individual" ? "player" : role, isHostTakingQuiz },
    });
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (role === "host" && !isHostTakingQuiz) navigate(`/proctor/${activeRoomCode}`);
      else {
        enterFullScreen();
        navigate(`/quiz/${topicId}`, { state: { ...location.state, role } });
      }
      return;
    }
    const timerInterval = setInterval(() => setCountdown((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearInterval(timerInterval);
  }, [countdown, navigate, topicId, location.state, role, isHostTakingQuiz, activeRoomCode]);

  const handleCopyCode = () => {
    if (activeRoomCode) {
      navigator.clipboard.writeText(activeRoomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/peer-quiz?join=${activeRoomCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=Join my Quiz Session&body=Hey! Join my live quiz session. Code: ${activeRoomCode} %0A%0A Link: ${window.location.origin}/peer-quiz?join=${activeRoomCode}`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={36} />
        <p className="text-lg font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase text-sm">Preparing Environment...</p>
      </div>
    );
  }

  if (!topicInfo || generatedQuestions.length === 0) {
    return <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] p-12 text-center font-bold text-slate-500 dark:text-slate-400">Paper Initialization Failed. Please return to Config.</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative">
        <AnimatePresence>
          {(isKicked || hostLeft) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-slate-900/80 dark:bg-[#0B0F19]/80 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center"
            >
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800">
                {isKicked ? <XCircle className="text-red-500 mb-4 mx-auto" size={56} /> : <LogOut className="text-amber-500 mb-4 mx-auto" size={56} />}
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{isKicked ? "You were removed" : "Session Ended"}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{isKicked ? "The host has removed you from this lobby." : "The host has closed the lobby or disconnected."}</p>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                  <Loader2 className="animate-spin" size={16} /> Redirecting...
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Instructions & Details */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {topicInfo.title}
                </h1>
                <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/30 shrink-0">
                  {subMode} Mode
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:dark:bg-slate-800/60 transition-colors rounded-2xl flex flex-col gap-2 border border-slate-100 dark:border-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400"><Clock size={16} /></div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">Time Limit</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{timer === "No Limit" ? "No Limit" : `${timer} mins`}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:dark:bg-slate-800/60 transition-colors rounded-2xl flex flex-col gap-2 border border-slate-100 dark:border-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><HelpCircle size={16} /></div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">Questions</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{generatedQuestions.length}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:dark:bg-slate-800/60 transition-colors rounded-2xl flex flex-col gap-2 border border-slate-100 dark:border-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400"><BarChart size={16} /></div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">Difficulty</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm truncate block">{difficulty}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:dark:bg-slate-800/60 transition-colors rounded-2xl flex flex-col gap-2 border border-slate-100 dark:border-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400"><Layers size={16} /></div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">Coverage</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm truncate block" title={isAllTopics ? "All Topics" : selectedSubTopics.join(", ")}>
                      {isAllTopics ? "All Topics" : selectedSubTopics.length + " Topics"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
              
              {/* TINTED CALLOUTS */}
              <div className="bg-white dark:bg-blue-950/20 p-6 rounded-2xl border-l-4 border-l-blue-500 border border-slate-200 dark:border-blue-900/30 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-blue-50 flex items-center gap-2 mb-3">
                  <Info size={18} className="text-blue-500 dark:text-blue-400" /> General Instructions
                </h3>
                <ul className="text-sm text-slate-600 dark:text-blue-200/80 space-y-2 ml-6 list-disc marker:text-blue-400 dark:marker:text-blue-500">
                  <li>Read each question carefully before selecting an option.</li>
                  <li>You can use the <strong>"Mark for Review"</strong> button to easily revisit tough questions later.</li>
                  <li>You must submit the quiz manually when finished, otherwise it will auto-submit when the timer expires.</li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-purple-950/20 p-6 rounded-2xl border-l-4 border-l-purple-500 border border-slate-200 dark:border-purple-900/30 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-purple-50 flex items-center gap-2 mb-3">
                  <Lightbulb size={18} className="text-purple-500 dark:text-purple-400" /> Tips for Success
                </h3>
                <ul className="text-sm text-slate-600 dark:text-purple-200/80 space-y-2 ml-6 list-disc marker:text-purple-400 dark:marker:text-purple-500">
                  <li>Do not spend too much time on a single question. Skip it and come back later.</li>
                  <li>Use the elimination method to narrow down multiple-choice options.</li>
                  <li>Always double-check your skipped and marked questions using the side palette before submitting.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-red-950/20 p-6 rounded-2xl border-l-4 border-l-red-500 border border-slate-200 dark:border-red-900/30 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-red-50 flex items-center gap-2 mb-3">
                  <ShieldAlert size={18} className="text-red-500 dark:text-red-400" /> Proctoring & Security Rules
                </h3>
                <ul className="text-sm text-slate-600 dark:text-red-200/80 space-y-2 ml-6 list-disc marker:text-red-400 dark:marker:text-red-500">
                  <li><strong>Fullscreen Locked:</strong> You are forced into fullscreen mode. Exiting will trigger a strike.</li>
                  <li><strong>Tab Switching:</strong> Navigating away from the quiz tab is tracked. Receiving 3 strikes will force auto-submission.</li>
                  <li><strong>Single Display:</strong> Using multiple monitors is strictly prohibited and will prevent you from starting.</li>
                  <li><strong>Right Click Disabled:</strong> Copy-pasting functionality has been disabled to protect quiz integrity.</li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Lobby Area */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden min-h-125 flex flex-col"
            >
              <AnimatePresence>
                {lobbyStatus === "starting" && countdown !== null && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 bg-blue-600 dark:bg-blue-700 flex flex-col items-center justify-center text-white"
                  >
                    <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-8xl font-black mb-4 drop-shadow-lg">
                      {countdown}
                    </motion.div>
                    <p className="text-xl font-bold opacity-90 animate-pulse">Entering fullscreen and starting...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {hasMultipleDisplays && (
                <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-xl p-4 mb-6 text-center animate-pulse">
                  <MonitorOff size={32} className="mx-auto text-red-500 mb-2" />
                  <p className="font-bold text-red-800 dark:text-red-200">Multiple Displays Detected</p>
                  <p className="text-sm text-red-600 dark:text-red-400">Please disconnect your secondary monitor to start.</p>
                </div>
              )}

              {/* Solo Player Mode */}
              {playMode === "individual" && (
                <div className="text-center py-4 grow flex flex-col justify-center">
                  <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-8">
                    <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="transparent" strokeWidth="4" className="stroke-slate-100 dark:stroke-slate-800" />
                      <circle cx="50" cy="50" r="46" fill="transparent" strokeWidth="6" strokeLinecap="round" className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-1000 ease-linear" strokeDasharray={289} strokeDashoffset={289 - 289 * ((countdown || 0) / 30)} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-900 dark:text-white">{countdown}</span>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Secs</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ready to begin?</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-4">
                    Your session is ready. You will be automatically transitioned into fullscreen mode.
                  </p>
                  <button
                    onClick={handleManualStart}
                    disabled={hasMultipleDisplays}
                    className="w-full py-4 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg dark:shadow-blue-600/20 mt-auto flex items-center justify-center gap-2 transition-all"
                  >
                    <Maximize size={20} /> Skip Timer & Start
                  </button>
                </div>
              )}

              {/* Host Lobby View */}
              {playMode === "multi" && role === "host" && (
                <div className="flex flex-col h-full">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="text-blue-500 dark:text-blue-400" /> Live Lobby Hub
                  </h3>
                  
                  {/* Premium Room Code Card */}
                  <div className="bg-linear-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-3xl p-6 text-white text-center shadow-lg dark:shadow-blue-900/30 relative overflow-hidden mb-6 border border-transparent dark:border-blue-800/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <p className="text-blue-200 dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Room Code</p>
                    <p className="text-5xl font-black tracking-[0.15em] mb-6 relative z-10">{activeRoomCode}</p>
                    
                    <div className="flex justify-center gap-3 relative z-10">
                      <button onClick={handleCopyCode} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${copiedCode ? 'bg-emerald-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                        {copiedCode ? <Check size={16} /> : <Copy size={16} />} {copiedCode ? "Copied!" : "Code"}
                      </button>
                      <button onClick={handleCopyLink} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${copiedLink ? 'bg-emerald-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                        {copiedLink ? <Check size={16} /> : <LinkIcon size={16} />} {copiedLink ? "Copied!" : "Link"}
                      </button>
                      <button onClick={handleEmail} className="flex items-center justify-center p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors">
                        <Mail size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 grow flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Participants</p>
                      <span className="bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full text-xs font-bold">{liveParticipants.length} Joined</span>
                    </div>
                    
                    <div className="space-y-2 overflow-y-auto pr-2 grow scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                      {liveParticipants.length === 0 ? (
                        <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500">
                          Waiting for peers to join...
                        </div>
                      ) : (
                        <AnimatePresence>
                          {liveParticipants.map((p) => (
                            <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={p.userId} className="flex justify-between items-center text-sm p-3.5 border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/40 rounded-xl group">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-black">
                                  {p.name.charAt(0).toUpperCase()}
                                </div>
                                {p.name}
                                {p.userId === user?._id && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Host</span>}
                              </span>
                              {p.userId !== user?._id && (
                                <button onClick={() => handleKickParticipant(p.userId)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Remove Player">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      <input type="checkbox" checked={isHostTakingQuiz} onChange={(e) => setIsHostTakingQuiz(e.target.checked)} className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 dark:bg-slate-900 focus:ring-blue-500" />
                      <div className="text-sm">
                        <p className="font-bold text-slate-900 dark:text-white">I am also participating</p>
                        <p className="text-slate-500 dark:text-slate-400">Uncheck to access the Proctoring Dashboard instead.</p>
                      </div>
                    </label>

                    <button onClick={handleHostStart} disabled={hasMultipleDisplays || liveParticipants.length === 0} className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:dark:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg dark:shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
                      <Maximize size={20} /> Start Quiz for All
                    </button>
                  </div>
                </div>
              )}

              {/* Participant Lobby View */}
              {playMode === "multi" && role === "participant" && (
                <div className="flex flex-col h-full py-4">
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold text-sm mb-8 border border-emerald-200 dark:border-emerald-900/30">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Connected to Room
                    </div>
                    
                    <div className="w-28 h-28 mx-auto bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center mb-6 border-8 border-white dark:border-slate-900 shadow-xl relative">
                      <User size={48} />
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 dark:bg-blue-600 rounded-full flex items-center justify-center text-white border-4 border-white dark:border-slate-900 shadow-sm">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">You're in!</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Review the instructions on the left while you wait.</p>
                  </div>

                  <div className="grow flex flex-col min-h-0 mb-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex justify-between items-center">
                      <span>Lobby Roster</span>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs">{liveParticipants.length} Joined</span>
                    </p>
                    <div className="space-y-2 overflow-y-auto pr-2 grow scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                      <AnimatePresence>
                        {liveParticipants.map((p) => (
                          <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={p.userId} className="flex items-center text-sm p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300 flex items-center justify-center font-bold text-xs mr-3">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {p.userId === user?._id ? "You" : p.name}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold shadow-xl dark:shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                      <Loader2 size={20} className="animate-spin text-slate-400 dark:text-blue-200" /> 
                      Waiting for Host to Start...
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}