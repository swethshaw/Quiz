import { useState, useEffect, useRef } from "react";
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
  FileJson,
  PlusCircle,
  Search,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useCohort } from "../context/CohortContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function CreatePaperPage() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const { user } = useUser();
  const { cohortData, activeCohort } = useCohort();
  const currentTopics = cohortData[activeCohort] || [];
  const topicInfo = currentTopics.find((t) => t._id === topicId);
  
  const [paperName, setPaperName] = useState("");
  const [activeTab, setActiveTab] = useState<"manual" | "upload" | "bank">("manual");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQText, setCurrentQText] = useState("");
  const [currentOptions, setCurrentOptions] = useState(["", "", "", ""]);
  const [currentCorrectIndex, setCurrentCorrectIndex] = useState(0);
  const [currentExplanation, setCurrentExplanation] = useState("");
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const [bankFetched, setBankFetched] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (activeTab === "bank" && !bankFetched && user?._id) {
      const fetchBankQuestions = async () => {
        setIsLoadingBank(true);
        try {
          const res = await fetch(`${API_URL}/api/papers/user/${user._id}`);
          const data = await res.json();
          if (data.success) {
            const allPastQuestions: any[] = [];
            data.data.forEach((paper: any) => {
              paper.questions.forEach((q: any) => {
                allPastQuestions.push({ ...q, sourcePaper: paper.title });
              });
            });
            setBankQuestions(allPastQuestions);
            setBankFetched(true);
          }
        } catch (err) {
          setErrorMsg("Failed to load Question Bank.");
        } finally {
          setIsLoadingBank(false);
        }
      };
      fetchBankQuestions();
    }
  }, [activeTab, bankFetched, user]);

  const filteredBankQuestions = bankQuestions.filter(q => 
    q.question.toLowerCase().includes(bankSearch.toLowerCase()) || 
    q.sourcePaper.toLowerCase().includes(bankSearch.toLowerCase())
  );
  const handleDownloadSample = () => {
    const sampleData = [
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswerIndex: 2,
        explanation: "Paris is the capital and most populous city of France."
      },
      {
        question: "Which of the following is not a JavaScript data type?",
        options: ["String", "Boolean", "Float", "Undefined"],
        correctAnswerIndex: 2,
        explanation: "JavaScript has 'Number', but not a specific 'Float' data type."
      }
    ];
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "peerlearning_sample_format.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddFromBank = (q: any) => {
    const isAlreadyAdded = questions.some(draftQ => draftQ.question === q.question);
    if (isAlreadyAdded) {
      setErrorMsg("This question is already in your draft.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    const { sourcePaper, _id, ...cleanQuestion } = q;
    setQuestions([...questions, cleanQuestion]);
    setSuccessMsg("Question added from bank!");
    setTimeout(() => setSuccessMsg(""), 2000);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setErrorMsg("Currently, only .json file imports are supported.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        
        if (!Array.isArray(parsedData)) {
          throw new Error("JSON must be an array of questions.");
        }
        const validQuestions = parsedData.filter(q => 
          q.question && 
          Array.isArray(q.options) && q.options.length >= 2 && 
          typeof q.correctAnswerIndex === "number"
        );

        if (validQuestions.length > 0) {
          setQuestions(prev => [...prev, ...validQuestions]);
          setSuccessMsg(`Successfully imported ${validQuestions.length} questions!`);
          setTimeout(() => setSuccessMsg(""), 3000);
          setErrorMsg("");
        } else {
          setErrorMsg("Could not find any valid questions matching the required format.");
        }
      } catch (err) {
        setErrorMsg("Invalid JSON format. Please ensure the file is formatted correctly.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

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
      const res = await fetch(`${API_URL}/api/papers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          topicId: topicId,
          cohort: activeCohort,
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
    return <div className="p-8 text-center text-slate-500 font-bold">Loading Context...</div>;
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Create Custom Paper</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Topic: <span className="text-violet-500">{topicInfo.title}</span>
          </p>
        </div>
      </div>
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold text-sm shadow-xl flex items-center gap-3">
              <AlertCircle size={16} /> {errorMsg}
              <button onClick={() => setErrorMsg("")} className="ml-4 text-red-400 hover:text-red-700">✕</button>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl font-bold text-sm shadow-xl flex items-center gap-3">
              <CheckCircle2 size={16} /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
        <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Paper Name</label>
        <input
          type="text"
          placeholder="e.g., Weekend DOM Manipulation Challenge"
          value={paperName}
          onChange={(e) => { setPaperName(e.target.value); if (errorMsg) setErrorMsg(""); }}
          disabled={isSaving}
          className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
        />
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab("manual")} className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === "manual" ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <Edit3 size={18} /> Manual Entry
        </button>
        <button onClick={() => setActiveTab("upload")} className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === "upload" ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <UploadCloud size={18} /> Upload JSON
        </button>
        <button onClick={() => setActiveTab("bank")} className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === "bank" ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <Library size={18} /> Pick from Bank
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm h-full flex flex-col">
            {activeTab === "manual" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Question Text</label>
                  <textarea
                    value={currentQText}
                    onChange={(e) => setCurrentQText(e.target.value)}
                    disabled={isSaving}
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-6 h-28 focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none transition-colors text-slate-900 dark:text-white"
                    placeholder="e.g., What does HTML stand for?"
                  />

                  <div className="mb-4 flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Answer Options</label>
                    <span className="text-xs text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Select the correct one</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[0, 1, 2, 3].map((index) => {
                      const isCorrect = currentCorrectIndex === index;
                      return (
                        <div key={index} onClick={() => setCurrentCorrectIndex(index)} className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-all cursor-pointer ${isCorrect ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${isCorrect ? "border-emerald-500 bg-emerald-500" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"}`}>
                            {isCorrect && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                          <input
                            type="text"
                            value={currentOptions[index]}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            disabled={isSaving}
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Explanation (Optional)</label>
                  <input
                    type="text"
                    value={currentExplanation}
                    onChange={(e) => setCurrentExplanation(e.target.value)}
                    disabled={isSaving}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-6 focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white transition-colors"
                    placeholder="Explain why the answer is correct..."
                  />

                  <button
                    onClick={handleAddQuestion}
                    disabled={isSaving}
                    className="w-full py-4 bg-slate-100 hover:bg-violet-50 dark:bg-slate-800 dark:hover:bg-violet-900/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 border border-transparent hover:border-violet-200 dark:hover:border-violet-800"
                  >
                    <Plus size={20} /> Add Question to Paper
                  </button>
                </div>
              </motion.div>
            )}
            {activeTab === "upload" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center py-10 text-center">
                <div className="w-20 h-20 bg-violet-50 dark:bg-violet-900/30 text-violet-500 rounded-full flex items-center justify-center mb-6 border-4 border-violet-100 dark:border-violet-800">
                  <FileJson size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Upload JSON Format</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                  Upload an array of questions. Ensure each object contains <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">question</code>, an <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">options</code> array, and a <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">correctAnswerIndex</code>.
                </p>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={handleDownloadSample} 
                    className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    Download Template
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
                  >
                    <UploadCloud size={18} /> Browse Files
                  </button>
                </div>
              </motion.div>
            )}
            {activeTab === "bank" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full min-h-100">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search past questions..." 
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {isLoadingBank ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p className="text-sm font-bold">Loading past papers...</p>
                  </div>
                ) : bankQuestions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Library size={48} className="mb-4 opacity-30" />
                    <p className="text-sm font-bold">No past questions found.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {filteredBankQuestions.map((q, idx) => {
                      const isAdded = questions.some(draftQ => draftQ.question === q.question);
                      return (
                        <div key={idx} className={`p-4 rounded-xl border transition-colors ${isAdded ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'}`}>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{q.question}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 bg-violet-50 dark:bg-violet-900/20 inline-block px-2 py-0.5 rounded">From: {q.sourcePaper}</p>
                            </div>
                            <button 
                              onClick={() => handleAddFromBank(q)}
                              disabled={isAdded}
                              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isAdded ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50'}`}
                            >
                              {isAdded ? <CheckCircle2 size={14} /> : <PlusCircle size={14} />}
                              {isAdded ? 'Added' : 'Add'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} />
              Paper Draft ({questions.length})
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-75 max-h-125 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              {questions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                  <HelpCircle size={40} className="mb-2 opacity-30" />
                  <p className="text-sm font-bold">No questions added yet.</p>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 relative group">
                    <div className="flex gap-3 pr-8">
                      <span className="font-black text-slate-400">{idx + 1}.</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{q.question}</p>
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
                className="w-full py-4 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? "Saving Paper..." : "Save & Publish Paper"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}