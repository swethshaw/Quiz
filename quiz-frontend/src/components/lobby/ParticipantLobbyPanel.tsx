import { User, Check, Loader2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ParticipantLobbyPanelProps {
  liveParticipants: any[];
  user: any;
  handleParticipantLeave: () => void;
}

export default function ParticipantLobbyPanel({
  liveParticipants,
  user,
  handleParticipantLeave,
}: ParticipantLobbyPanelProps) {
  return (
    <div className="flex flex-col h-full py-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold text-sm mb-8 border border-emerald-200 dark:border-emerald-900/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Connected to Room
        </div>

        <div className="w-28 h-28 mx-auto bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center mb-6 border-8 border-white dark:border-slate-900 shadow-xl relative">
          <User size={48} />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 dark:bg-blue-600 rounded-full flex items-center justify-center text-white border-4 border-white dark:border-slate-900 shadow-sm">
            <Check size={18} strokeWidth={3} />
          </div>
        </div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
          You're in!
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Review the instructions on the left while you wait.
        </p>
      </div>

      <div className="grow flex flex-col min-h-0 mb-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/50">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex justify-between items-center">
          <span>Lobby Roster</span>
          <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs">
            {liveParticipants.length} Joined
          </span>
        </p>
        <div className="space-y-2 overflow-y-auto pr-2 grow scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          <AnimatePresence>
            {liveParticipants.map((p) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={p.userId}
                className="flex items-center text-sm p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300 flex items-center justify-center font-bold text-xs mr-3">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-slate-800 dark:text-white">
                  {p.userId === user?._id ? (
                    <span className="flex items-center gap-2">
                      {p.name}
                      <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-200 dark:border-blue-700/50">
                        You
                      </span>
                    </span>
                  ) : (
                    p.name
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold shadow-xl dark:shadow-[0_0_20px_rgba(37,99,235,0.15)]">
          <Loader2 size={20} className="animate-spin text-slate-400 dark:text-blue-200" />
          Waiting for Host to Start...
        </div>
        <button
          onClick={handleParticipantLeave}
          className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={20} /> Exit Lobby
        </button>
      </div>
    </div>
  );
}