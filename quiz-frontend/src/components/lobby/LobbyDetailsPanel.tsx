import { Clock, HelpCircle, BarChart, Layers, Info, Lightbulb, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface LobbyDetailsPanelProps {
  topicInfo: any;
  subMode: string;
  timer: string | null;
  questionCount: number;
  difficulty: string;
  isAllTopics: boolean;
  selectedSubTopics: string[];
}

export default function LobbyDetailsPanel({
  topicInfo,
  subMode,
  timer,
  questionCount,
  difficulty,
  isAllTopics,
  selectedSubTopics,
}: LobbyDetailsPanelProps) {
  return (
    <div className="lg:col-span-7 space-y-6">
      {/* Header & Stats Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {topicInfo?.title || "Custom Quiz"}
          </h1>
          <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/30 shrink-0">
            {subMode} Mode
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:dark:bg-slate-800/60 transition-colors rounded-2xl flex flex-col gap-2 border border-slate-100 dark:border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                Time Limit
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {timer === "No Limit" ? "No Limit" : `${timer} mins`}
              </span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:dark:bg-slate-800/60 transition-colors rounded-2xl flex flex-col gap-2 border border-slate-100 dark:border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <HelpCircle size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                Questions
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {questionCount}
              </span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:dark:bg-slate-800/60 transition-colors rounded-2xl flex flex-col gap-2 border border-slate-100 dark:border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <BarChart size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                Difficulty
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm truncate block">
                {difficulty}
              </span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:dark:bg-slate-800/60 transition-colors rounded-2xl flex flex-col gap-2 border border-slate-100 dark:border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Layers size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                Coverage
              </span>
              <span
                className="font-bold text-slate-900 dark:text-white text-sm truncate block"
                title={isAllTopics ? "All Topics" : selectedSubTopics.join(", ")}
              >
                {isAllTopics ? "All Topics" : `${selectedSubTopics.length} Topics`}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rules & Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="bg-white dark:bg-blue-950/20 p-6 rounded-2xl border-l-4 border-l-blue-500 border border-slate-200 dark:border-blue-900/30 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-blue-50 flex items-center gap-2 mb-3">
            <Info size={18} className="text-blue-500 dark:text-blue-400" />
            General Instructions
          </h3>
          <ul className="text-sm text-slate-600 dark:text-blue-200/80 space-y-2 ml-6 list-disc marker:text-blue-400 dark:marker:text-blue-500">
            <li>Read each question carefully before selecting an option.</li>
            <li>You can use the <strong>"Mark for Review"</strong> button to easily revisit tough questions later.</li>
            <li>You must submit the quiz manually when finished, otherwise it will auto-submit when the timer expires.</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-purple-950/20 p-6 rounded-2xl border-l-4 border-l-purple-500 border border-slate-200 dark:border-purple-900/30 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-purple-50 flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-purple-500 dark:text-purple-400" />
            Tips for Success
          </h3>
          <ul className="text-sm text-slate-600 dark:text-purple-200/80 space-y-2 ml-6 list-disc marker:text-purple-400 dark:marker:text-purple-500">
            <li>Do not spend too much time on a single question. Skip it and come back later.</li>
            <li>Use the elimination method to narrow down multiple-choice options.</li>
            <li>Always double-check your skipped and marked questions using the side palette before submitting.</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-red-950/20 p-6 rounded-2xl border-l-4 border-l-red-500 border border-slate-200 dark:border-red-900/30 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-red-50 flex items-center gap-2 mb-3">
            <ShieldAlert size={18} className="text-red-500 dark:text-red-400" />
            Proctoring & Security Rules
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
  );
}