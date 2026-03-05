import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowLeft,
  Loader2,
  Trophy,
  Timer,
} from "lucide-react";
import { useUser } from "../context/UserContext";

export default function ResultDetailPage() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [result, setResult] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchResultDetails = async () => {
      if (!user) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/results/user/${user._id}`,
        );
        const data = await res.json();

        if (data.success) {
          const foundResult = data.data.find((r: any) => r._id === resultId);
          setResult(foundResult);
          if (foundResult?.playMode === "multi" && foundResult.roomCode) {
            const roomRes = await fetch(
              `http://localhost:5000/api/rooms/${foundResult.roomCode}`,
            );
            const roomData = await roomRes.json();

            if (roomData.success) {
              const sorted = roomData.data.participants
                .filter(
                  (p: any) =>
                    p.status === "Submitted" || p.status === "Blocked",
                )
                .sort(
                  (a: any, b: any) =>
                    b.score - a.score ||
                    a.timeSpentSeconds - b.timeSpentSeconds,
                );

              setLeaderboard(sorted);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch result details", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResultDetails();
  }, [resultId, user]);

  if (isLoading) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="font-bold text-slate-500">Loading Result Data...</p>
      </div>
    );
  }

  if (!result)
    return (
      <div className="p-8 font-bold text-slate-500 text-center">
        Result not found or access denied.
      </div>
    );
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;

  if (result.review && result.review.length > 0) {
    result.review.forEach((q: any) => {
      if (q.userAnswerIndex === null || q.userAnswerIndex === undefined) {
        skippedCount++;
      } else if (q.userAnswerIndex === q.correctAnswerIndex) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });
  } else {
    correctCount = result.score;
    incorrectCount = result.totalQuestions - result.score;
    skippedCount = 0;
  }

  const topicTitle = result.topicId?.title || "Assessment";
  const dateFormatted = new Date(result.createdAt).toLocaleDateString();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <button
        onClick={() => navigate("/results")}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Results
      </button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm mb-6 relative overflow-hidden text-center"
      >
        <div className="inline-block px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 mb-6 uppercase">
          {result.playMode} MODE • {dateFormatted}
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">
          {topicTitle}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Final Grade:{" "}
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {result.percentage}%
          </span>
        </p>

        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md transition-colors mb-10"
        >
          Back to Dashboard
        </button>
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-lg mx-auto">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <CheckCircle2 className="text-green-500 mb-2" size={28} />
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              {correctCount}
            </span>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">
              Correct
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-500 dark:border-red-400 shadow-md shadow-red-500/10 scale-105">
            <XCircle className="text-red-500 mb-2" size={28} />
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              {incorrectCount}
            </span>
            <span className="text-[10px] md:text-xs font-bold text-red-600 dark:text-red-400 uppercase">
              Incorrect
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <MinusCircle className="text-slate-400 mb-2" size={28} />
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              {skippedCount}
            </span>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">
              Skipped
            </span>
          </div>
        </div>
      </motion.div>
      {result.playMode === "multi" && leaderboard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm mb-6"
        >
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Trophy className="text-yellow-500" size={28} /> Match Leaderboard
          </h3>
          <div className="space-y-3">
            {leaderboard.map((p, i) => {
              const isCurrentUser = p.userId === user?._id;
              return (
                <div
                  key={p.userId}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isCurrentUser ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm" : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"}`}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-8 flex justify-center text-xl md:text-2xl font-black">
                      {i === 0 ? (
                        "🥇"
                      ) : i === 1 ? (
                        "🥈"
                      ) : i === 2 ? (
                        "🥉"
                      ) : (
                        <span className="text-slate-400 text-lg">{i + 1}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {p.name}{" "}
                        {isCurrentUser && (
                          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                    <div className="font-black text-lg md:text-xl text-slate-900 dark:text-white leading-none">
                      {p.score}{" "}
                      <span className="text-xs text-slate-500 font-bold uppercase">
                        pts
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-bold mt-1.5 flex items-center justify-end gap-1">
                      <Timer size={12} /> {formatTime(p.timeSpentSeconds)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      {result.review && result.review.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Detailed Question Review
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Review your answers. Correct answers are hidden to protect the quiz
            integrity.
          </p>

          <div className="space-y-10">
            {result.review.map((q: any, qIndex: number) => {
              const isSkipped =
                q.userAnswerIndex === null || q.userAnswerIndex === undefined;
              const isQuestionCorrect =
                !isSkipped && q.userAnswerIndex === q.correctAnswerIndex;

              return (
                <div key={qIndex} className="relative pl-10 md:pl-12">
                  {/* Index Circle Indicator */}
                  <div
                    className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${isQuestionCorrect ? "bg-green-500" : isSkipped ? "bg-slate-300 dark:bg-slate-600" : "bg-red-500"}`}
                  >
                    {qIndex + 1}
                  </div>

                  <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-4 leading-relaxed">
                    {q.question}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((option: string, optIndex: number) => {
                      const isCorrectOption = optIndex === q.correctAnswerIndex;
                      const isUserSelected = optIndex === q.userAnswerIndex;
                      let optionStyle =
                        "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
                      if (isUserSelected) {
                        if (isCorrectOption) {
                          optionStyle =
                            "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-300 shadow-sm ring-1 ring-green-500";
                        } else {
                          optionStyle =
                            "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-300 shadow-sm ring-1 ring-red-500";
                        }
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`px-4 py-3 rounded-xl border font-medium text-sm flex items-center gap-3 transition-colors ${optionStyle}`}
                        >
                          <span className="font-bold opacity-70">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          {option}
                        </div>
                      );
                    })}
                  </div>
                  {isQuestionCorrect && q.explanation && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/50 text-sm text-green-800 dark:text-green-300">
                      <span className="font-bold block mb-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
