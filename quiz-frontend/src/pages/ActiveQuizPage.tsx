import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Timer,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Award,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  RotateCcw,
  Home,
  Loader2,
  Trophy,
  UserX,
  AlertOctagon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useCohort } from "../context/CohortContext";

export default function ActiveQuizPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { cohortData, activeCohort } = useCohort();
  const {
    playMode = "individual",
    subMode = "test",
    timer = "30",
    generatedQuestions = [],
    roomCode,
  } = location.state || {};
  const activeRoomCode = roomCode || null;
  const isRevision = subMode === "revision";
  const currentTopics = cohortData[activeCohort] || [];
  const topicInfo = currentTopics.find((t) => t._id === topicId);
  const initialTimeInSeconds =
    isRevision || timer === "No Limit" ? 0 : parseInt(timer) * 60;
  const [questions] = useState<any[]>(generatedQuestions);
  const [isFinished, setIsFinished] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(
    new Set(),
  );
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [evaluations, setEvaluations] = useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<
    Record<number, boolean>
  >({});
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [score, setScore] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fsWarningTimer, setFsWarningTimer] = useState(10);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [hostAction, setHostAction] = useState<{
    type: "kick" | "block" | "end";
    msg: string;
  } | null>(null);

  const submitQuiz = useCallback(async () => {
    if (isFinished || !user) return;
    let finalScore = 0;
    const reviewData = questions.map((q, idx) => {
      const userAnswer = answers[idx] !== undefined ? answers[idx] : null;
      if (userAnswer === q.correctAnswerIndex) finalScore++;
      return {
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        userAnswerIndex: userAnswer,
        explanation: q.explanation || "",
      };
    });

    setScore(finalScore);
    setIsFinished(true);

    const timeSpent = isRevision
      ? timeLeft
      : parseInt(location.state?.timer || "30") * 60 - timeLeft;
    try {
      const res = await fetch("http://localhost:5000/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          topicId: topicId,
          cohort: activeCohort,
          customPaperId: location.state?.customPaperId || null,
          roomCode: activeRoomCode,
          score: finalScore,
          totalQuestions: questions.length,
          percentage: Math.round((finalScore / questions.length) * 100),
          timeSpentSeconds: timeSpent,
          playMode: playMode,
          review: reviewData,
        }),
      });
      const data = await res.json();
      if (data.success) setSavedResultId(data.data._id);
    } catch (err) {
      console.error("Failed to save result", err);
    }
    if (playMode === "multi" && activeRoomCode) {
      try {
        await fetch(
          `http://localhost:5000/api/rooms/submit/${activeRoomCode}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user._id,
              score: finalScore,
              timeSpentSeconds: timeSpent,
            }),
          },
        );
      } catch (err) {
        console.error("Failed to update room leaderboard", err);
      }
    }

    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [
    answers,
    questions,
    isFinished,
    user,
    topicId,
    playMode,
    isRevision,
    timeLeft,
    location.state,
    activeRoomCode,
  ]);

  useEffect(() => {
    if (playMode !== "multi" || !activeRoomCode || isFinished || hostAction)
      return;

    const pollRoom = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/rooms/${activeRoomCode}`,
        );
        const data = await res.json();

        if (data.success) {
          const room = data.data;
          if (room.status === "finished") {
            setHostAction({
              type: "end",
              msg: "The host has ended the quiz for everyone.",
            });
            return;
          }

          const me = room.participants.find((p: any) => p.userId === user?._id);
          if (!me)
            setHostAction({
              type: "kick",
              msg: "The host has removed you from the session.",
            });
          else if (me.status === "Blocked")
            setHostAction({
              type: "block",
              msg: "The host has force-submitted your quiz.",
            });
        }
      } catch (err) {}
    };

    const interval = setInterval(pollRoom, 3000);
    return () => clearInterval(interval);
  }, [playMode, activeRoomCode, isFinished, hostAction, user]);

  useEffect(() => {
    if (!hostAction) return;
    const timer = setTimeout(() => {
      if (hostAction.type === "kick") {
        if (document.fullscreenElement)
          document.exitFullscreen().catch(() => {});
        navigate("/");
      } else {
        submitQuiz();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [hostAction, navigate, submitQuiz]);

  useEffect(() => {
    if (!isFinished || playMode !== "multi" || !activeRoomCode) return;
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/rooms/${activeRoomCode}`,
        );
        const data = await res.json();
        if (data.success) {
          const sorted = data.data.participants
            .filter(
              (p: any) => p.status === "Submitted" || p.status === "Blocked",
            )
            .sort(
              (a: any, b: any) =>
                b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds,
            );
          setLeaderboard(sorted);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, [isFinished, playMode, activeRoomCode]);

  useEffect(() => {
  if (isFinished) return;

  // Block right click
  const blockContextMenu = (e:any) => e.preventDefault();

  // Allow only LEFT CLICK
  const blockMouseButtons = (e:any) => {
    if (e.button !== 0) {
      e.preventDefault();
    }
  };

  // Block keyboard shortcuts
  const blockKeyboard = (e:any) => {
    e.preventDefault();
  };

  // Block scrolling
  const blockScroll = (e:any) => {
    e.preventDefault();
  };

  // Block clipboard actions
  const blockClipboard = (e:any) => {
    e.preventDefault();
  };

  document.addEventListener("contextmenu", blockContextMenu);
  document.addEventListener("mousedown", blockMouseButtons);
  document.addEventListener("keydown", blockKeyboard);
  document.addEventListener("wheel", blockScroll, { passive: false });
  document.addEventListener("copy", blockClipboard);
  document.addEventListener("paste", blockClipboard);
  document.addEventListener("cut", blockClipboard);

  return () => {
    document.removeEventListener("contextmenu", blockContextMenu);
    document.removeEventListener("mousedown", blockMouseButtons);
    document.removeEventListener("keydown", blockKeyboard);
    document.removeEventListener("wheel", blockScroll);
    document.removeEventListener("copy", blockClipboard);
    document.removeEventListener("paste", blockClipboard);
    document.removeEventListener("cut", blockClipboard);
  };
}, [isFinished]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isFinished) {
        setWarnings((w) => {
          const next = w + 1;
          if (playMode === "multi" && activeRoomCode && user) {
            fetch(`http://localhost:5000/api/rooms/warning/${activeRoomCode}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user._id }),
            }).catch(console.error);
          }
          if (next >= 3) submitQuiz();
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isFinished, submitQuiz, playMode, activeRoomCode, user]);
  
//   useEffect(() => {
//   if (isFinished) return;

//   let devtoolsOpen = false;

//   const detectDevTools = () => {
//     const threshold = 30;

//     const widthThreshold =
//       window.outerWidth - window.innerWidth > threshold;
//     const heightThreshold =
//       window.outerHeight - window.innerHeight > threshold;

//     if (widthThreshold || heightThreshold) {
//       if (!devtoolsOpen) {
//         devtoolsOpen = true;

//         setWarnings((w) => {
//           const next = w + 1;

//           if (playMode === "multi" && activeRoomCode && user) {
//             fetch(`http://localhost:5000/api/rooms/warning/${activeRoomCode}`, {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({ userId: user._id }),
//             }).catch(console.error);
//           }

//           if (next >= 3) submitQuiz();

//           return next;
//         });
//       }
//     } else {
//       devtoolsOpen = false;
//     }
//   };

//   const interval = setInterval(detectDevTools, 1000);

//   return () => clearInterval(interval);
// }, [isFinished, playMode, activeRoomCode, user, submitQuiz]);

//   useEffect(() => {
//   if (isFinished) return;

//   let detected = false;

//   const element = new Image();

//   Object.defineProperty(element, "id", {
//     get: function () {
//       if (!detected) {
//         detected = true;

//         setWarnings((w) => {
//           const next = w + 1;

//           if (playMode === "multi" && activeRoomCode && user) {
//             fetch(`http://localhost:5000/api/rooms/warning/${activeRoomCode}`, {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({ userId: user._id }),
//             }).catch(console.error);
//           }

//           if (next >= 3) submitQuiz();

//           return next;
//         });
//       }
//     },
//   });

//   const interval = setInterval(() => {
//     console.log(element);
//   }, 1000);

//   return () => clearInterval(interval);
// }, [isFinished, playMode, activeRoomCode, user, submitQuiz]);

  useEffect(() => {
    const checkFullscreen = () => {
      if (!document.fullscreenElement && !isFinished && !hostAction) {
        setShowFullscreenWarning(true);
        setFsWarningTimer((prev) => (prev <= 0 ? 10 : prev));
      }
    };
    checkFullscreen();
    document.addEventListener("fullscreenchange", checkFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", checkFullscreen);
  }, [isFinished, hostAction]);

  useEffect(() => {
    if (!showFullscreenWarning || fsWarningTimer <= 0) return;
    const t = setInterval(() => setFsWarningTimer((p) => p - 1), 1000);
    if (fsWarningTimer === 1) submitQuiz();
    return () => clearInterval(t);
  }, [showFullscreenWarning, fsWarningTimer, submitQuiz]);

  const returnToFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {});
    setShowFullscreenWarning(false);
    setFsWarningTimer(10);
  };

  useEffect(() => {
    if (isFinished || questions.length === 0 || hostAction) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (isRevision) return prev + 1;
        if (prev <= 1) {
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, isRevision, submitQuiz, questions.length, hostAction]);

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  const handleOptionSelect = (optIndex: number) => {
    if (isRevision && evaluations[currentQuestionIndex]) return;
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optIndex }));
    if (skipped.has(currentQuestionIndex)) {
      const newSkipped = new Set(skipped);
      newSkipped.delete(currentQuestionIndex);
      setSkipped(newSkipped);
    }
  };

  const handleClear = () => {
    if (isRevision && evaluations[currentQuestionIndex]) return;
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestionIndex];
    setAnswers(newAnswers);
  };

  const handleMark = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestionIndex))
      newMarked.delete(currentQuestionIndex);
    else newMarked.add(currentQuestionIndex);
    setMarkedForReview(new Set(newMarked));
  };

  const evaluateCurrent = () => {
    if (!isRevision || answers[currentQuestionIndex] === undefined) return;
    const isCorrect =
      answers[currentQuestionIndex] ===
      questions[currentQuestionIndex].correctAnswerIndex;
    setEvaluations((prev) => ({ ...prev, [currentQuestionIndex]: isCorrect }));
    if (!isCorrect)
      setShowExplanation((prev) => ({ ...prev, [currentQuestionIndex]: true }));
  };

  const navigateTo = (index: number) => {
    if (
      isRevision &&
      answers[currentQuestionIndex] !== undefined &&
      !evaluations[currentQuestionIndex]
    )
      evaluateCurrent();
    setCurrentQuestionIndex(index);
  };

  const handleSkip = () => {
    const newSkipped = new Set(skipped);
    newSkipped.add(currentQuestionIndex);
    setSkipped(newSkipped);
    if (currentQuestionIndex < questions.length - 1)
      navigateTo(currentQuestionIndex + 1);
  };

  if (!topicInfo || questions.length === 0)
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Paper Initialization Failed.
      </div>
    );
  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 py-12">
        <div
          className={`grid grid-cols-1 ${playMode === "multi" ? "lg:grid-cols-2 gap-8 max-w-5xl" : "max-w-md"} w-full`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full text-center shadow-xl border border-slate-100 dark:border-slate-700 h-fit"
          >
            <Award size={64} className="mx-auto text-green-500 mb-6" />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              Quiz Submitted!
            </h2>
            <p className="text-slate-500 mb-8">
              You have successfully completed the assessment.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl mb-8 border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Score
              </p>
              <p className="text-5xl font-black text-blue-600 dark:text-blue-400">
                {percentage}%
              </p>
              <p className="text-sm font-medium mt-2 text-slate-600 dark:text-slate-400">
                {score} out of {questions.length} correct
              </p>

              {warnings > 0 && (
                <div className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg text-xs font-bold border border-orange-200 dark:border-orange-800">
                  <ShieldAlert size={14} /> Total Warnings Received: {warnings}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() =>
                  navigate(
                    savedResultId ? `/results/${savedResultId}` : `/results`,
                    { replace: true },
                  )
                }
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/20"
              >
                View Detailed Analysis
              </button>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Home size={18} /> Return to Dashboard
              </button>
            </div>
          </motion.div>

          {playMode === "multi" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col h-137.5"
            >
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                <Trophy className="text-yellow-500" size={28} /> Live
                Leaderboard
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center text-slate-500 font-bold mt-10 animate-pulse">
                    Waiting for scores...
                  </div>
                ) : (
                  leaderboard.map((p, i) => (
                    <div
                      key={p.userId}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${p.userId === user?._id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 flex justify-center text-xl font-black">
                          {i === 0 ? (
                            "🥇"
                          ) : i === 1 ? (
                            "🥈"
                          ) : i === 2 ? (
                            "🥉"
                          ) : (
                            <span className="text-slate-400 text-base">
                              {i + 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {p.name}{" "}
                            {p.userId === user?._id && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          {p.status === "Blocked" && (
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                              Force Submitted
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-lg text-slate-900 dark:text-white leading-none">
                          {p.score}{" "}
                          <span className="text-xs text-slate-500">pts</span>
                        </div>
                        <div className="text-xs text-slate-500 font-bold mt-1 flex items-center justify-end gap-1">
                          <Timer size={12} /> {formatTime(p.timeSpentSeconds)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }
  const currentQ = questions[currentQuestionIndex];
  const isAnswered = answers[currentQuestionIndex] !== undefined;
  const isEval = isRevision && evaluations[currentQuestionIndex] !== undefined;

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50/50 to-fuchsia-50/50 dark:from-slate-900 dark:to-slate-900 font-sans flex flex-col select-none">
      <AnimatePresence>
        {hostAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-100 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border-4 border-red-500"
            >
              {hostAction.type === "kick" ? (
                <UserX
                  size={64}
                  className="mx-auto text-red-500 mb-4 animate-pulse"
                />
              ) : (
                <AlertOctagon
                  size={64}
                  className="mx-auto text-orange-500 mb-4 animate-pulse"
                />
              )}
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                Notice from Host
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6 font-medium text-lg">
                {hostAction.msg}
              </p>
              <div className="flex justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFullscreenWarning && !hostAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border-4 border-red-500">
              <AlertTriangle
                size={56}
                className="mx-auto text-red-500 mb-4 animate-pulse"
              />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                Fullscreen Required
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6 font-medium">
                You must remain in fullscreen mode. Auto-submitting in:
              </p>
              <p className="text-7xl font-black text-red-500 mb-8">
                {fsWarningTimer-1}
              </p>
              <button
                onClick={returnToFullscreen}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg shadow-lg"
              >
                Return to Fullscreen Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
          {topicInfo.title}
        </h1>
        <div className="flex items-center gap-4">
          {warnings > 0 && (
            <span className="px-3 py-1.5 bg-red-100 text-red-700 font-bold text-xs rounded-full flex items-center gap-1 border border-red-200">
              <ShieldAlert size={14} /> Warnings: {warnings}/3
            </span>
          )}
          <button
            onClick={submitQuiz}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
          >
            Finish & Submit
          </button>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full flex flex-col lg:flex-row gap-6 p-4 md:p-6 lg:p-8">
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6 gap-4">
            {isRevision && (
              <div className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold uppercase tracking-widest rounded-md shadow-sm">
                Revision Mode
              </div>
            )}
            <div className="flex-1">
              <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                <span>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span>
                  {Math.round(
                    ((currentQuestionIndex + 1) / questions.length) * 100,
                  )}
                  % Complete
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 shadow-lg mb-6 text-white relative">
            <div className="flex justify-between items-center mb-6">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                MCQ
              </span>
              <div className="flex items-center gap-1.5 font-bold text-sm bg-black/20 px-4 py-1.5 rounded-full">
                <Timer
                  size={16}
                  className={
                    !isRevision && timeLeft < 60
                      ? "text-red-400 animate-pulse"
                      : ""
                  }
                />
                <span
                  className={!isRevision && timeLeft < 60 ? "text-red-400" : ""}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold leading-relaxed">
              Q. {currentQ.question}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentQ.options.map((option: string, index: number) => {
              const isSelected = answers[currentQuestionIndex] === index;
              const isCorrectAnswer =
                questions[currentQuestionIndex].correctAnswerIndex === index;

              let btnClass =
                "border-2 border-blue-200 dark:border-slate-700 bg-blue-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
              if (isSelected && (!isRevision || !isEval))
                btnClass =
                  "border-2 border-blue-500 bg-blue-100 text-blue-800 shadow-md";
              else if (isRevision && isEval) {
                if (isCorrectAnswer)
                  btnClass =
                    "border-2 border-green-500 bg-green-100 text-green-800 shadow-md";
                else if (isSelected && !isCorrectAnswer)
                  btnClass =
                    "border-2 border-red-500 bg-red-100 text-red-800 shadow-md";
                else
                  btnClass =
                    "border-2 border-slate-200 bg-white/50 opacity-50 cursor-not-allowed";
              }
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isRevision && isEval}
                  className={`w-full text-left p-4 md:p-5 rounded-xl font-bold transition-all flex items-center gap-4 ${btnClass}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm text-sm ${isSelected ? "text-blue-600" : "text-slate-500"}`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  {option}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <button
                onClick={handleMark}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${markedForReview.has(currentQuestionIndex) ? "bg-purple-100 text-purple-700 border border-purple-300" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
              >
                <Bookmark
                  size={18}
                  fill={
                    markedForReview.has(currentQuestionIndex)
                      ? "currentColor"
                      : "none"
                  }
                />{" "}
                Mark
              </button>
              <button
                onClick={handleClear}
                disabled={isRevision && isEval}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw size={18} /> Clear
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  navigateTo(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleSkip}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm"
              >
                Skip
              </button>
              {isRevision && !isEval && isAnswered && (
                <button
                  onClick={evaluateCurrent}
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
                >
                  Check Answer
                </button>
              )}
              <button
                onClick={() =>
                  navigateTo(
                    Math.min(questions.length - 1, currentQuestionIndex + 1),
                  )
                }
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <AnimatePresence>
            {isRevision && isEval && showExplanation[currentQuestionIndex] && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm overflow-hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="text-green-500" size={20} />{" "}
                    Correct Answer:{" "}
                    {String.fromCharCode(
                      65 + questions[currentQuestionIndex].correctAnswerIndex,
                    )}
                  </h3>
                  <button
                    onClick={() =>
                      setShowExplanation((p) => ({
                        ...p,
                        [currentQuestionIndex]: false,
                      }))
                    }
                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Hide Explanation
                  </button>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm space-y-3 leading-relaxed">
                  <p>
                    {questions[currentQuestionIndex].explanation ||
                      `The correct answer is ${String.fromCharCode(65 + questions[currentQuestionIndex].correctAnswerIndex)}.`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm lg:sticky lg:top-24">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> Question Palette
            </h3>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((_, idx) => {
                let baseClass =
                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-2 border-transparent";
                if (answers[idx] !== undefined)
                  baseClass =
                    "bg-green-500 text-white shadow-sm border-2 border-transparent";
                else if (skipped.has(idx))
                  baseClass =
                    "bg-red-100 text-red-700 border-2 border-transparent";
                if (markedForReview.has(idx))
                  baseClass = "border-2 border-purple-500 shadow-md";
                if (currentQuestionIndex === idx)
                  baseClass += " ring-4 ring-blue-300 scale-110 z-10";
                return (
                  <button
                    key={idx}
                    onClick={() => navigateTo(idx)}
                    className={`w-full aspect-square rounded-lg font-bold text-sm flex items-center justify-center transition-all ${baseClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-600 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-green-500 shadow-sm"></div>{" "}
                Attempted
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></div>{" "}
                Unattempted
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-red-100"></div> Skipped
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded border-2 border-purple-500 bg-white"></div>{" "}
                Marked for Review
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
