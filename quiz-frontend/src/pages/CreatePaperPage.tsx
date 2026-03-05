import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UploadCloud,
  Edit3,
  Save,
  Plus,
  Library,
  Loader2,
  CheckCircle2,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useCohort } from "../context/CohortContext";

export default function CreatePaperPage() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const { user } = useUser();
  const { cohortData, activeCohort } = useCohort();
  const currentTopics = cohortData[activeCohort] || [];
  const topicInfo = currentTopics.find((t) => t._id === topicId);
  const [paperName, setPaperName] = useState("");
  const [activeTab, setActiveTab] = useState<"manual" | "upload" | "bank">(
    "manual",
  );
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQText, setCurrentQText] = useState("");
  const [currentOptions, setCurrentOptions] = useState(["", "", "", ""]);
  const [currentCorrectIndex, setCurrentCorrectIndex] = useState(0);
  const [currentExplanation, setCurrentExplanation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    setCurrentOptions(newOptions);
  };

  const handleAddQuestion = () => {
    setErrorMsg("");
    if (!currentQText.trim()) {
      setErrorMsg("Please enter the question text.");
      return;
    }
    if (currentOptions.some((opt) => !opt.trim())) {
      setErrorMsg("Please fill out all 4 options.");
      return;
    }

    const newQuestion = {
      question: currentQText.trim(),
      options: currentOptions.map((o) => o.trim()),
      correctAnswerIndex: currentCorrectIndex,
      explanation: currentExplanation.trim(),
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQText("");
    setCurrentOptions(["", "", "", ""]);
    setCurrentCorrectIndex(0);
    setCurrentExplanation("");
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    setQuestions(questions.filter((_, idx) => idx !== indexToDelete));
  };

  const handleSavePaper = async () => {
    if (!user || !topicId) return;
    setErrorMsg("");

    if (!paperName.trim()) {
      setErrorMsg("Please provide a paper name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (questions.length === 0) {
      setErrorMsg("Please add at least one question to the paper.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("http://localhost:5000/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          topicId: topicId,
          title: paperName.trim(),
          questions: questions,
        }),
      });

      const data = await res.json();

      if (data.success) {
        navigate(`/config/${topicId}`);
      } else {
        setErrorMsg(data.message || "Failed to save paper.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setErrorMsg("Failed to connect to the server.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!topicInfo) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Loading Context...
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Create Custom Paper
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Topic: <span className="text-blue-500">{topicInfo.title}</span>
          </p>
        </div>
      </div>
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold text-sm shadow-sm flex justify-between items-center"
          >
            {errorMsg}
            <button
              onClick={() => setErrorMsg("")}
              className="text-red-400 hover:text-red-700 font-black"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
        <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
          Paper Name
        </label>
        <input
          type="text"
          placeholder="e.g., Weekend DOM Manipulation Challenge"
          value={paperName}
          onChange={(e) => {
            setPaperName(e.target.value);
            if (errorMsg) setErrorMsg("");
          }}
          disabled={isSaving}
          className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
        />
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === "manual" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"}`}
        >
          <Edit3 size={18} /> Manual Entry
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === "upload" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"}`}
        >
          <UploadCloud size={18} /> Upload PDF/JSON
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === "bank" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"}`}
        >
          <Library size={18} /> Pick from Bank
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm h-full">
            {activeTab === "manual" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Question Text
                  </label>
                  <textarea
                    value={currentQText}
                    onChange={(e) => setCurrentQText(e.target.value)}
                    disabled={isSaving}
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-6 h-28 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-colors text-slate-900 dark:text-white"
                    placeholder="e.g., What does HTML stand for?"
                  />

                  <div className="mb-4 flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                      Answer Options
                    </label>
                    <span className="text-xs text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      Select the correct one
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[0, 1, 2, 3].map((index) => {
                      const isCorrect = currentCorrectIndex === index;
                      return (
                        <div
                          key={index}
                          onClick={() => setCurrentCorrectIndex(index)}
                          className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-all cursor-pointer ${isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"}`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${isCorrect ? "border-green-500 bg-green-500" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"}`}
                          >
                            {isCorrect && (
                              <CheckCircle2 size={14} className="text-white" />
                            )}
                          </div>
                          <input
                            type="text"
                            value={currentOptions[index]}
                            onChange={(e) =>
                              handleOptionChange(index, e.target.value)
                            }
                            disabled={isSaving}
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Explanation (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentExplanation}
                    onChange={(e) => setCurrentExplanation(e.target.value)}
                    disabled={isSaving}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-6 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
                    placeholder="Explain why the answer is correct..."
                  />

                  <button
                    onClick={handleAddQuestion}
                    disabled={isSaving}
                    className="w-full py-4 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    <Plus size={20} /> Add Question to Paper
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "upload" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-6 border-4 border-blue-100 dark:border-blue-800">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Drag & Drop your file
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                  Upload a formatted JSON or PDF file. Our AI will automatically
                  parse the questions and answers.
                </p>
                <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors">
                  Browse Files
                </button>
              </motion.div>
            )}

            {activeTab === "bank" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-500"
              >
                <Library size={48} className="mb-4 opacity-50" />
                <p className="font-bold">Question Bank feature coming soon.</p>
              </motion.div>
            )}
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-500" size={20} />
              Paper Draft ({questions.length})
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-75 max-h-125">
              {questions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                  <HelpCircle size={40} className="mb-2 opacity-50" />
                  <p className="text-sm font-bold">No questions added yet.</p>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 relative group"
                  >
                    <div className="flex gap-3 pr-8">
                      <span className="font-black text-slate-400">
                        {idx + 1}.
                      </span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {q.question}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(idx)}
                      disabled={isSaving}
                      className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                      title="Remove Question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 mt-auto border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleSavePaper}
                disabled={questions.length === 0 || isSaving}
                className="w-full py-4 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                {isSaving ? "Saving Paper..." : "Save & Publish Paper"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
