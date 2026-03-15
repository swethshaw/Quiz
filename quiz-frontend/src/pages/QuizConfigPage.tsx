import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Users,
  Play,
  Settings2,
  Check,
  ChevronDown,
  Clock,
  HelpCircle,
  Layers,
  Database,
  FileText,
  Plus,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";

type PlayMode = "individual" | "multi";
type SubMode = "test" | "revision";
type QuestionSource = "standard" | "previous" | "create";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const DIFFICULTY_OPTIONS = ["Easy", "Intermediate", "Hard"];
const QUESTION_TYPE_OPTIONS = [
  "Not Attempted",
  "Answered Wrong",
  "Answered Correct",
  "Skipped",
];
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function QuizConfigPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { cohortData, activeCohort } = useCohort();
  const { user } = useUser();
  const currentTopics = cohortData[activeCohort] || [];
  const topicInfo = currentTopics.find((t) => t._id === topicId);

  const { playMode: defaultPlayMode = "individual" } = location.state || {};

  const [playMode, setPlayMode] = useState<PlayMode>(defaultPlayMode);
  const [subMode, setSubMode] = useState<SubMode>("test");
  const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([
    "Mix",
  ]);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([
    "Mixed",
  ]);
  const [questionSource, setQuestionSource] =
    useState<QuestionSource>("standard");
  const [selectedPaperId, setSelectedPaperId] = useState<string>("");
  const [myPapers, setMyPapers] = useState<any[]>([]);
  const [timer, setTimer] = useState<string>("30");
  const [questionCount, setQuestionCount] = useState<string>("30");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchMyPapers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/papers/user/${user._id}`);
        const data = await res.json();
        if (data.success) {
          const topicPapers = data.data.filter(
            (p: any) => p.topicId === topicId,
          );
          setMyPapers(topicPapers);
        }
      } catch (err) {
        console.error("Failed to fetch custom papers", err);
      }
    };
    fetchMyPapers();
  }, [user, topicId]);

  useEffect(() => {
    if (subMode === "revision") setTimer("No Limit");
    else if (timer === "No Limit") setTimer("30");
  }, [subMode, timer]);

  useEffect(() => {
    if (questionSource === "previous" && selectedPaperId) {
      const paper = myPapers.find((p) => p._id === selectedPaperId);
      if (paper) setQuestionCount(paper.questions.length.toString());
    }
  }, [questionSource, selectedPaperId, myPapers]);

  const handleSubTopicToggle = (topic: string) => {
    if (topic === "All") {
      setSelectedSubTopics(
        selectedSubTopics.length === (topicInfo?.subTopics?.length || 0)
          ? []
          : [...(topicInfo?.subTopics || [])],
      );
      return;
    }
    if (selectedSubTopics.includes(topic))
      setSelectedSubTopics(selectedSubTopics.filter((t) => t !== topic));
    else setSelectedSubTopics([...selectedSubTopics, topic]);
  };

  const handleDifficultyToggle = (diff: string) => {
    if (diff === "Mix") {
      setSelectedDifficulties(["Mix"]);
      return;
    }
    let newDiffs = selectedDifficulties.filter((d) => d !== "Mix");
    if (newDiffs.includes(diff)) newDiffs = newDiffs.filter((d) => d !== diff);
    else newDiffs.push(diff);

    if (newDiffs.length === 0) setSelectedDifficulties(["Mix"]);
    else setSelectedDifficulties(newDiffs);
  };

  const handleQTypeToggle = (type: string) => {
    if (type === "Mixed") {
      setSelectedQuestionTypes(["Mixed"]);
      return;
    }
    let newTypes = selectedQuestionTypes.filter((t) => t !== "Mixed");
    if (newTypes.includes(type)) newTypes = newTypes.filter((t) => t !== type);
    else newTypes.push(type);

    if (newTypes.length === 0) setSelectedQuestionTypes(["Mixed"]);
    else setSelectedQuestionTypes(newTypes);
  };

  const isAllSelected =
    selectedSubTopics.length === (topicInfo?.subTopics?.length || 0) &&
    (topicInfo?.subTopics?.length || 0) > 0;
  const isLaunchDisabled =
    (questionSource === "standard" && selectedSubTopics.length === 0) ||
    (questionSource === "previous" && !selectedPaperId) ||
    questionSource === "create";

  const getLaunchButtonText = () => {
    if (isGenerating) return "Validating & Generating...";
    if (questionSource === "create") return "Create a paper first";
    if (questionSource === "previous" && !selectedPaperId)
      return "Select a previous paper";
    if (questionSource === "standard" && selectedSubTopics.length === 0)
      return "Select at least one chapter";
    return "Enter Fullscreen & Launch";
  };

  const handleLaunch = async () => {
    if (!user) return;
    setErrorMsg("");
    setIsGenerating(true);

    try {
      try {
        await document.documentElement.requestFullscreen();
      } catch (e) {
        console.log("Fullscreen request deferred or denied.");
      }

      let finalQuestions = [];

      if (questionSource === "previous") {
        const res = await fetch(`${API_URL}/api/papers/${selectedPaperId}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        finalQuestions = data.data.questions;
      } else {
        const res = await fetch(`${API_URL}/api/quiz/generate-quiz`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            topicId,
            subTopics: selectedSubTopics,
            difficulty: selectedDifficulties,
            limit: questionCount,
            subMode,
            questionType:
              subMode === "revision" ? selectedQuestionTypes : undefined,
          }),
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message);
        finalQuestions = data.data;
      }

      let newRoomCode = null;

      if (playMode === "multi") {
        const roomRes = await fetch(`${API_URL}/api/rooms/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostId: user._id,
            topicId,
            questions: finalQuestions,
          }),
        });
        const roomData = await roomRes.json();
        if (!roomData.success) throw new Error(roomData.message);
        newRoomCode = roomData.data.code;
      }

      navigate(`/lobby/${topicId}`, {
        state: {
          playMode,
          subMode,
          timer,
          questionCount,
          difficulty: selectedDifficulties.join(", "),
          selectedSubTopics,
          isAllTopics: isAllSelected,
          customPaperId: questionSource === "previous" ? selectedPaperId : null,
          generatedQuestions: finalQuestions,
          roomCode: newRoomCode,
          role: "host", // <-- CRITICAL FIX: Explicitly set the host role here!
        },
      });
    } catch (err: any) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setErrorMsg(err.message || "Failed to generate paper.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!topicInfo)
    return (
      <div className="p-8 font-bold text-slate-500 text-center flex flex-col items-center gap-2 mt-10">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        Loading Configuration...
      </div>
    );

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 w-full"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-linear-to-r from-blue-700 to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent mb-4 tracking-tight">
          Let's Start Quizzing!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-lg max-w-2xl mx-auto">
          Customize your session for{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {topicInfo?.title}
          </span>
          . Choose your mode, select topics, and set your difficulty.
        </p>
      </motion.div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl shadow-sm flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg("")}
              className="text-red-400 hover:text-red-700"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 md:mb-10"
      >
        {/* Individual Mode */}
        <motion.div variants={fadeUp} className="w-full">
          <div
            onClick={() => setPlayMode("individual")}
            className={`cursor-pointer rounded-3xl p-6 md:p-8 border-2 transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden group ${playMode === "individual" ? "border-blue-500 bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-300 dark:hover:border-blue-700"}`}
          >
            {playMode === "individual" && (
              <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-400 to-blue-600"></div>
            )}
            <div
              className={`p-4 rounded-2xl transition-colors ${playMode === "individual" ? "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}
            >
              <User size={36} />
            </div>
            <div>
              <h3
                className={`text-xl font-bold ${playMode === "individual" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
              >
                Individual Mode
              </h3>
            </div>
            <AnimatePresence>
              {playMode === "individual" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex w-full bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl mt-2 relative overflow-hidden"
                >
                  <motion.div
                    layout
                    className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                    animate={{ x: subMode === "revision" ? 0 : "100%" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubMode("revision");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors z-10 ${subMode === "revision" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    Revision
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubMode("test");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors z-10 ${subMode === "test" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    Test
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Multi Mode */}
        <motion.div variants={fadeUp} className="w-full">
          <div
            onClick={() => setPlayMode("multi")}
            className={`cursor-pointer rounded-3xl p-6 md:p-8 border-2 transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden group ${playMode === "multi" ? "border-blue-500 bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-300 dark:hover:border-blue-700"}`}
          >
            {playMode === "multi" && (
              <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-400 to-blue-600"></div>
            )}
            <div
              className={`p-4 rounded-2xl transition-colors ${playMode === "multi" ? "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}
            >
              <Users size={36} />
            </div>
            <div>
              <h3
                className={`text-xl font-bold ${playMode === "multi" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
              >
                Multi-mode
              </h3>
            </div>
            <AnimatePresence>
              {playMode === "multi" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex w-full bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl mt-2 relative overflow-hidden"
                >
                  <motion.div
                    layout
                    className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                    animate={{ x: subMode === "revision" ? 0 : "100%" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubMode("revision");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors z-10 ${subMode === "revision" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    Revision
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubMode("test");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors z-10 ${subMode === "test" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    Test
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full space-y-6 md:space-y-8 bg-white dark:bg-slate-900 p-6 md:p-8 lg:p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none"
      >
        <div className="w-full pb-6 border-b border-slate-100 dark:border-slate-800 overflow-hidden">
          <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
            Paper Source
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setQuestionSource("standard")}
              className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all ${questionSource === "standard" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}
            >
              <Database size={18} /> Standard Topics
            </button>
            <button
              onClick={() => setQuestionSource("previous")}
              className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all ${questionSource === "previous" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}
            >
              <FileText size={18} /> My Papers
            </button>
            <button
              onClick={() => setQuestionSource("create")}
              className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all ${questionSource === "create" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}
            >
              <Plus size={18} /> Create New
            </button>
          </div>
          <div className="mt-4">
            {questionSource === "previous" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                <select
                  value={selectedPaperId}
                  onChange={(e) => setSelectedPaperId(e.target.value)}
                  className="w-full appearance-none px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                >
                  <option value="" disabled>
                    Select a previously created paper...
                  </option>
                  {myPapers.map((paper) => (
                    <option key={paper._id} value={paper._id}>
                      {paper.title} ({paper.questions.length} Qs)
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </motion.div>
            )}
            {questionSource === "create" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                    Build a Custom Paper
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/create-paper/${topicId}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  Go to Creator
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Subject Display */}
        <div className="w-full">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
            <Layers size={16} /> Main Subject
          </label>
          <div className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-not-allowed flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings2 size={20} className="text-blue-500" />
              {topicInfo?.title}
            </div>
            <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md">
              Locked
            </span>
          </div>
        </div>
        {questionSource === "standard" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                Select Chapters / Topics
              </label>
              <div className="flex flex-wrap gap-2.5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-inner">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSubTopicToggle("All")}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isAllSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400"}`}
                >
                  {isAllSelected && <Check size={16} />} All Topics
                </motion.button>
                {(topicInfo?.subTopics || []).map((topic) => {
                  const isSelected = selectedSubTopics.includes(topic);
                  return (
                    <motion.button
                      key={topic}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSubTopicToggle(topic)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isSelected ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-sm" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                    >
                      {isSelected && <Check size={16} />} {topic}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                Select Difficulty
              </label>
              <div className="flex flex-wrap gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDifficultyToggle("Mix")}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedDifficulties.includes("Mix") ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400"}`}
                >
                  {selectedDifficulties.includes("Mix") && <Check size={16} />}{" "}
                  Mix (All)
                </motion.button>
                {DIFFICULTY_OPTIONS.map((diff) => {
                  const isSelected = selectedDifficulties.includes(diff);
                  return (
                    <motion.button
                      key={diff}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDifficultyToggle(diff)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isSelected ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-sm" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                    >
                      {isSelected && <Check size={16} />} {diff}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <AnimatePresence>
              {subMode === "revision" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="flex items-center gap-1.5 text-sm font-bold text-blue-500 dark:text-blue-400 mb-3">
                    <Layers size={16} /> Question Type
                  </label>
                  <div className="flex flex-wrap gap-2.5 p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/50">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQTypeToggle("Mixed")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedQuestionTypes.includes("Mixed") ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400"}`}
                    >
                      {selectedQuestionTypes.includes("Mixed") && (
                        <Check size={16} />
                      )}{" "}
                      All Types
                    </motion.button>
                    {QUESTION_TYPE_OPTIONS.map((type) => {
                      const isSelected = selectedQuestionTypes.includes(type);
                      return (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleQTypeToggle(type)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isSelected ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200 border border-blue-400 dark:border-blue-600 shadow-sm" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                        >
                          {isSelected && <Check size={16} />} {type}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              <Clock size={14} /> Time Limit
            </label>
            <div className="relative">
              <select
                value={timer}
                onChange={(e) => setTimer(e.target.value)}
                disabled={subMode === "revision"}
                className="w-full appearance-none px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:opacity-50"
              >
                {subMode === "revision" ? (
                  <option value="No Limit">No Limit</option>
                ) : (
                  <>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                  </>
                )}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <div className="relative">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              <HelpCircle size={14} /> Questions
            </label>
            <div className="relative">
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                disabled={
                  questionSource === "previous" && selectedPaperId !== ""
                }
                className="w-full appearance-none px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:opacity-50"
              >
                {questionSource === "previous" && selectedPaperId ? (
                  <option value={questionCount}>
                    {questionCount} Questions (From Paper)
                  </option>
                ) : (
                  <>
                    <option value="5">5 Questions</option>
                    <option value="15">15 Questions</option>
                    <option value="30">30 Questions</option>
                    <option value="45">45 Questions</option>
                  </>
                )}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
        <motion.div
          layout
          className="pt-6 border-t border-slate-100 dark:border-slate-800"
        >
          <motion.button
            whileHover={
              !isLaunchDisabled && !isGenerating ? { scale: 1.02 } : {}
            }
            whileTap={!isLaunchDisabled && !isGenerating ? { scale: 0.98 } : {}}
            onClick={handleLaunch}
            disabled={isLaunchDisabled || isGenerating}
            className={`w-full py-5 rounded-2xl font-bold text-lg md:text-xl flex items-center justify-center gap-3 transition-colors ${isLaunchDisabled || isGenerating ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-xl shadow-blue-500/30"}`}
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Play fill="currentColor" size={24} />
            )}
            {getLaunchButtonText()}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
