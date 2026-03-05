import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Lightbulb,
  Send,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Bug,
  BookOpen,
} from "lucide-react";
import { useUser } from "../context/UserContext";

export default function HelpCenterPage() {
  const [reportType, setReportType] = useState("question_error");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useUser();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I join a multiplayer quiz?",
      a: "Go to the 'Peer Quiz' tab, enter the 6-digit code provided by your host, and click 'Enter Lobby'.",
    },
    {
      q: "My quiz auto-submitted. Why?",
      a: "To prevent cheating, quizzes auto-submit if you exit fullscreen or switch browser tabs 3 times during an active test.",
    },
    {
      q: "Can I host a quiz with my own questions?",
      a: "Yes! In the Peer Quiz section, click 'Create a Room', then choose 'Create New' under the Paper Source options to build a custom test.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    setIsSubmitting(true);
    try {
      await fetch("http://localhost:5000/api/help/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          reportType: reportType,
          description: message,
        }),
      });
      setIsSubmitted(true);
      setMessage("");
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold bg-linear-to-r from-blue-700 to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent mb-3 tracking-tight flex items-center gap-3">
          <HelpCircle className="text-blue-600 dark:text-blue-400" size={36} />
          Help & Support Center
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-lg max-w-2xl">
          Found a bug? Have a suggestion? Or just want to discuss topics with
          your peers? You are in the right place.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-500" /> Submit
            Feedback
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                What are you reporting?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setReportType("question_error")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-sm font-bold transition-colors ${reportType === "question_error" ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-200"}`}
                >
                  <BookOpen size={20} /> Question Error
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("website_bug")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-sm font-bold transition-colors ${reportType === "website_bug" ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-200"}`}
                >
                  <Bug size={20} /> Website Bug
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("improvement")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-sm font-bold transition-colors ${reportType === "improvement" ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-green-200"}`}
                >
                  <Lightbulb size={20} /> Improvement
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
                Description
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  reportType === "question_error"
                    ? "E.g., Question 4 in HTML5 Quiz has the wrong correct answer marked..."
                    : reportType === "website_bug"
                      ? "E.g., The timer freezes when I open the sidebar..."
                      : "E.g., It would be great if we could see a dark mode toggle inside the active quiz..."
                }
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isSubmitted
                  ? "bg-green-500 text-white"
                  : !message.trim()
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
              }`}
            >
              {isSubmitted ? (
                <>
                  <CheckCircle2 size={20} /> Feedback Sent!
                </>
              ) : isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{" "}
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} /> Submit Report
                </>
              )}
            </button>
          </form>
        </motion.div>
        <div className="lg:col-span-5 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <MessageSquare size={120} />
            </div>

            <div className="relative z-10">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm mb-4 inline-block">
                Community
              </span>
              <h2 className="text-2xl font-bold mb-2">Discussion Forum</h2>
              <p className="text-indigo-100 mb-6 text-sm leading-relaxed">
                Connect with other learners, discuss tricky questions, share
                custom quiz codes, and study together in our community space.
              </p>

              <button className="w-full py-3.5 bg-white text-indigo-600 hover:bg-slate-50 font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                Join the Discussion <ExternalLink size={18} />
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm"
                  >
                    {faq.q}
                    <ChevronDown
                      size={16}
                      className={`transform transition-transform ${openFaq === idx ? "rotate-180 text-blue-500" : "text-slate-400"}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 text-sm text-slate-500 dark:text-slate-400"
                      >
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
