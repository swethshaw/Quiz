import { useEffect } from "react";
import { Sparkles, BookOpen, Target, Award } from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import TopicCard from "../components/TopicCard";
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function LearningPage() {
  const { activeCohort, cohortData, isLoading, refreshData } = useCohort();
  const { user } = useUser();
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const currentTopics = cohortData[activeCohort] || [];

  const totalSolvedQuestions = currentTopics.reduce(
    (acc, topic) => acc + topic.solvedQuestions,
    0,
  );
  const totalAvailableQuestions = currentTopics.reduce(
    (acc, topic) => acc + topic.totalQuestions,
    0,
  );
  const overallProgressPercentage =
    totalAvailableQuestions === 0
      ? 0
      : Math.round((totalSolvedQuestions / totalAvailableQuestions) * 100);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <motion.div
        key={activeCohort}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-start mb-8 md:mb-10 w-full"
      >
        <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 py-1 md:py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs md:text-sm font-medium mb-3 md:mb-4 shadow-sm">
          <Sparkles size={14} className="md:w-4 md:h-4" />
          <span>Welcome back, {user?.name || "Student"}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-3 md:mb-4 bg-linear-to-r from-blue-700 to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent tracking-tight">
          {activeCohort || "Loading..."} Track
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-lg">
          Select a topic below to continue practicing. Your progress is
          automatically saved.
        </p>
      </motion.div>

      <motion.div
        key={`stats-${activeCohort}-${totalSolvedQuestions}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12 w-full"
      >
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
              {currentTopics.length}
            </p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Core Topics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Target size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
              {totalSolvedQuestions}
            </p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Solved
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Award size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
              {overallProgressPercentage}%
            </p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Progress
            </p>
          </div>
        </div>
      </motion.div>
      <motion.div
        key={`cards-${activeCohort}`}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4 md:gap-6 w-full"
      >
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 font-bold animate-pulse">
            Loading topics from database...
          </div>
        ) : currentTopics.length > 0 ? (
          currentTopics.map((topic) => (
            <TopicCard key={topic._id} topic={{ ...topic, id: topic._id }} />
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              No topics available for this cohort yet.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
