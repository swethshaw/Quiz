import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, MonitorOff } from "lucide-react";
import { motion } from "framer-motion";
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";
import { io } from "socket.io-client";

// Import our new Modular Components
import DisconnectModal from "../components/lobby/DisconnectModal";
import LobbyDetailsPanel from "../components/lobby/LobbyDetailsPanel";
import LobbyCountdown from "../components/lobby/LobbyCountdown";
import HostLobbyPanel from "../components/lobby/HostLobbyPanel";
import ParticipantLobbyPanel from "../components/lobby/ParticipantLobbyPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io(API_URL);
type PlayMode = "individual" | "multi";

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

  const urlCode = new URLSearchParams(location.search).get("join") || new URLSearchParams(location.search).get("code");
  const activeRoomCode = roomCode || urlCode;

  const [isHost, setIsHost] = useState<boolean>(
    location.state?.role === "host" || demoRoleOverride === "host"
  );

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
  const liveParticipantsRef = useRef<any[]>([]);
  
  // FIX: Create stable refs for unload logic so the effect doesn't constantly re-trigger
  const userRef = useRef(user);
  const activeRoomCodeRef = useRef(activeRoomCode);
  const isHostRef = useRef(isHost);

  useEffect(() => {
    liveParticipantsRef.current = liveParticipants;
    userRef.current = user;
    activeRoomCodeRef.current = activeRoomCode;
    isHostRef.current = isHost;
  }, [liveParticipants, user, activeRoomCode, isHost]);

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

  // --- SMART UNLOAD & UNMOUNT LOGIC (FIXED) ---
useEffect(() => {
    const handleLeave = () => {
      // Use refs to get the latest state without adding them to dependencies
      const currentCode = activeRoomCodeRef.current;
      const currentUser = userRef.current;
      const currentIsHost = isHostRef.current;

      if (!currentCode || isNavigatingToQuiz.current || !currentUser) return;

      if (currentIsHost) {
        const peersCount = liveParticipantsRef.current.filter(
          (p: any) => p.userId !== currentUser._id,
        ).length;

        if (peersCount === 0) {
          navigator.sendBeacon(`${API_URL}/api/rooms/${currentCode}/delete`);
        } else {
          navigator.sendBeacon(`${API_URL}/api/rooms/${currentCode}/host-offline`);
        }
      } else {
        const blob = new Blob([JSON.stringify({ userId: currentUser._id })], {
          type: "application/json",
        });
        navigator.sendBeacon(`${API_URL}/api/rooms/leave/${currentCode}`, blob);
      }
    };

    // This ONLY fires when the user actually closes the tab or hits refresh
    window.addEventListener("beforeunload", handleLeave);

    return () => {
      window.removeEventListener("beforeunload", handleLeave);
      // 🔥 CRITICAL FIX: We completely removed the handleLeave() call from here.
      // React 18 Strict Mode can no longer trigger a ghost-delete on page load!
    };
  }, []);
  // --- API / SOCKET / POLLING LOGIC ---
  useEffect(() => {
    if (!isHost && activeRoomCode && user) {
      fetch(`${API_URL}/api/rooms/join/${activeRoomCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, name: user.name }),
      }).catch(console.error);
    }
  }, [isHost, activeRoomCode, user]);

  useEffect(() => {
    if (isHost && activeRoomCode && user) {
      if (isHostTakingQuiz) {
        fetch(`${API_URL}/api/rooms/join/${activeRoomCode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id, name: user.name }),
        }).catch(console.error);
      } else {
        fetch(`${API_URL}/api/rooms/host-action/${activeRoomCode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "kick", targetUserId: user._id }),
        }).catch(console.error);
      }
    }
  }, [isHostTakingQuiz, isHost, activeRoomCode, user]);

  useEffect(() => {
    if (playMode !== "multi" || !activeRoomCode || !user) return;
    socket.emit("join_room", activeRoomCode);

    socket.on("quiz_started", () => {
      setLobbyStatus("starting");
      setCountdown(5);
    });

    socket.on("force_action", ({ action, targetUserId }) => {
      if (targetUserId === user._id && action === "kick" && !isHost) {
        setIsKicked(true);
      }
    });

    return () => {
      socket.off("quiz_started");
      socket.off("force_action");
    };
  }, [playMode, activeRoomCode, user, isHost]);

  useEffect(() => {
    if (playMode !== "multi" || !activeRoomCode || !user) return;
    const pollRoom = async () => {
      try {
        const res = await fetch(`${API_URL}/api/rooms/${activeRoomCode}`);

        if (res.status === 404 || res.status === 410) {
          if (!isHost && lobbyStatus === "waiting") setHostLeft(true);
          return;
        }
        const data = await res.json();
        if (!data.success) {
          if (!isHost && lobbyStatus === "waiting") setHostLeft(true);
          return;
        }

        const room = data.data;
        const actualHostId = room.hostId?._id || room.hostId;
        
        if (String(actualHostId) === String(user._id)) {
          if (!isHost) setIsHost(true);
        } else {
          if (isHost) setIsHost(false);
        }

        setLiveParticipants(room.participants);

        if (!isHost && room.status === "playing" && lobbyStatus === "waiting") {
          setLobbyStatus("starting");
          setCountdown(5);
        }

        if (!isHost && room.status !== "playing") {
          const amIStillHere = room.participants.find((p: any) => p.userId === user._id);
          if (!amIStillHere) setIsKicked(true);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    pollRoom();
    const interval = setInterval(pollRoom, 2000);
    return () => clearInterval(interval);
  }, [playMode, activeRoomCode, user, isHost, lobbyStatus]);

  useEffect(() => {
    if (isKicked || hostLeft) setTimeout(() => navigate("/"), 3000);
  }, [isKicked, hostLeft, navigate]);

  // --- ACTION HANDLERS ---
  const handleKickParticipant = async (targetUserId: string) => {
    await fetch(`${API_URL}/api/rooms/host-action/${activeRoomCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "kick", targetUserId }),
    });
    socket.emit("host_action", { roomCode: activeRoomCode, action: "kick", targetUserId });
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this room? This will kick everyone out.")) return;
    isNavigatingToQuiz.current = true;
    try {
      await fetch(`${API_URL}/api/rooms/${activeRoomCode}`, { method: "DELETE" });
      navigate("/");
    } catch (err) {
      console.error("Failed to delete room:", err);
    }
  };

  const handleParticipantLeave = async () => {
    if (!window.confirm("Are you sure you want to exit the lobby?")) return;
    isNavigatingToQuiz.current = true;
    try {
      await fetch(`${API_URL}/api/rooms/leave/${activeRoomCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?._id }),
      });
      navigate("/");
    } catch (err) {
      console.error("Failed to leave room", err);
    }
  };

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.warn(err.message));
    }
  };

  const handleHostStart = async () => {
    if (hasMultipleDisplays) return;
    isNavigatingToQuiz.current = true;
    await fetch(`${API_URL}/api/rooms/host-action/${activeRoomCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    setLobbyStatus("starting");
    setCountdown(5);
    socket.emit("start_quiz", activeRoomCode);
  };

  const handleManualStart = () => {
    if (hasMultipleDisplays) return;
    enterFullScreen();
    navigate(`/quiz/${topicId}`, {
      state: {
        ...location.state,
        role: playMode === "individual" ? "player" : isHost ? "host" : "player",
        isHostTakingQuiz,
      },
    });
  };

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
    const subject = encodeURIComponent("Join my Quiz Session");
    const body = encodeURIComponent(
      `Hey! Join my live quiz session.\n\nCode: ${activeRoomCode}\n\nLink: ${window.location.origin}/peer-quiz?join=${activeRoomCode}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (isHost && !isHostTakingQuiz) {
        navigate(`/proctor/${activeRoomCode}`);
      } else {
        enterFullScreen();
        navigate(`/quiz/${topicId}`, {
          state: { ...location.state, role: isHost ? "host" : "player" },
        });
      }
      return;
    }
    const timerInterval = setInterval(() => setCountdown((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearInterval(timerInterval);
  }, [countdown, navigate, topicId, location.state, isHost, isHostTakingQuiz, activeRoomCode]);

  // --- RENDER ---
  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={36} />
        <p className="text-lg font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase text-sm">
          Preparing Environment...
        </p>
      </div>
    );
  }

  if (!topicInfo || generatedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] p-12 text-center font-bold text-slate-500 dark:text-slate-400">
        Paper Initialization Failed. Please return to Config.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative">
        
        {/* Modals */}
        <DisconnectModal isKicked={isKicked} hostLeft={hostLeft} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Rules & Information */}
          <LobbyDetailsPanel
            topicInfo={topicInfo}
            subMode={subMode}
            timer={timer}
            questionCount={generatedQuestions.length}
            difficulty={difficulty}
            isAllTopics={isAllTopics}
            selectedSubTopics={selectedSubTopics}
          />

          {/* Right Panel: Lobby & User Controls */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden min-h-125 flex flex-col"
            >
              
              <LobbyCountdown
                countdown={countdown}
                lobbyStatus={lobbyStatus}
                playMode={playMode as PlayMode}
                hasMultipleDisplays={hasMultipleDisplays}
                handleManualStart={handleManualStart}
              />

              {hasMultipleDisplays && (
                <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-xl p-4 mb-6 text-center animate-pulse">
                  <MonitorOff size={32} className="mx-auto text-red-500 mb-2" />
                  <p className="font-bold text-red-800 dark:text-red-200">
                    Multiple Displays Detected
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Please disconnect your secondary monitor to start.
                  </p>
                </div>
              )}

              {playMode === "multi" && isHost && (
                <HostLobbyPanel
                  activeRoomCode={activeRoomCode as string}
                  copiedCode={copiedCode}
                  copiedLink={copiedLink}
                  handleCopyCode={handleCopyCode}
                  handleCopyLink={handleCopyLink}
                  handleEmail={handleEmail}
                  liveParticipants={liveParticipants}
                  user={user}
                  handleKickParticipant={handleKickParticipant}
                  isHostTakingQuiz={isHostTakingQuiz}
                  setIsHostTakingQuiz={setIsHostTakingQuiz}
                  handleDeleteRoom={handleDeleteRoom}
                  handleHostStart={handleHostStart}
                  hasMultipleDisplays={hasMultipleDisplays}
                />
              )}

              {playMode === "multi" && !isHost && (
                <ParticipantLobbyPanel
                  liveParticipants={liveParticipants}
                  user={user}
                  handleParticipantLeave={handleParticipantLeave}
                />
              )}

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}