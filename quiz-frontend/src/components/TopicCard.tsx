import { motion, type Variants } from "framer-motion";
import { Code, CheckCircle2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
interface TopicCardProps {
  topic: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    totalQuestions: number;
    solvedQuestions: number;
  };
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function TopicCard({ topic }: TopicCardProps) {
  const navigate = useNavigate();
  const progressPercentage = Math.round(
    (topic.solvedQuestions / topic.totalQuestions) * 100,
  );

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.01, translateY: -4 }}
      transition={{ duration: 0.2 }}
      className="relative bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-4 md:mb-6 group cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/config/${topic.id}`);
      }}
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-400 to-blue-600"></div>

      <div className="p-5 md:p-8">
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
          <div className="shrink-0 flex sm:block justify-center sm:justify-start">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Code size={28} className="md:w-8 md:h-8" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:justify-between items-center sm:items-start gap-2 md:gap-4 mb-3">
              <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {topic.title}
              </h2>
              <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] md:text-xs font-semibold whitespace-nowrap">
                {topic.category}
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-5 md:mb-6">
              {topic.description}
            </p>

            <div className="mb-2 md:mb-4">
              <div className="flex justify-between text-xs md:text-sm mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Topic Progress
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 md:h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  className="bg-blue-600 h-full rounded-full"
                />
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 mt-2 text-left">
                {topic.solvedQuestions} of {topic.totalQuestions} questions
                solved
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 px-5 md:px-6 py-3 md:py-4 flex justify-between items-center transition-colors">
        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400">
          <CheckCircle2 size={16} className="md:w-4.5 md:h-4.5" />
          <span>Continue Quiz</span>
        </div>
        <motion.div
          whileHover={{ x: 5 }}
          className="text-slate-400 group-hover:text-blue-500 transition-colors"
        >
          <ChevronRight size={18} className="md:w-5 md:h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}
