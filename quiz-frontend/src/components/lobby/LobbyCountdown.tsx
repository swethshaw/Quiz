import { Maximize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LobbyCountdownProps {
  countdown: number | null;
  lobbyStatus: "waiting" | "starting";
  playMode: "individual" | "multi";
  hasMultipleDisplays: boolean;
  handleManualStart: () => void;
}

export default function LobbyCountdown({
  countdown,
  lobbyStatus,
  playMode,
  hasMultipleDisplays,
  handleManualStart,
}: LobbyCountdownProps) {
  return (
    <>
      {/* Multi-Mode Fullscreen Starting Overlay */}
      <AnimatePresence>
        {lobbyStatus === "starting" && countdown !== null && playMode === "multi" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-blue-600 dark:bg-blue-700 flex flex-col items-center justify-center text-white"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-8xl font-black mb-4 drop-shadow-lg"
            >
              {countdown}
            </motion.div>
            <p className="text-xl font-bold opacity-90 animate-pulse">
              Entering fullscreen and starting...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solo Player Mode UI */}
      {playMode === "individual" && (
        <div className="text-center py-4 grow flex flex-col justify-center">
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-8">
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-md"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="transparent"
                strokeWidth="4"
                className="stroke-slate-100 dark:stroke-slate-800"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="transparent"
                strokeWidth="6"
                strokeLinecap="round"
                className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-1000 ease-linear"
                strokeDasharray={289}
                strokeDashoffset={289 - 289 * ((countdown || 0) / 30)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-slate-900 dark:text-white">
                {countdown}
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                Secs
              </span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Ready to begin?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-4">
            Your session is ready. You will be automatically transitioned into
            fullscreen mode.
          </p>
          <button
            onClick={handleManualStart}
            disabled={hasMultipleDisplays}
            className="w-full py-4 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg dark:shadow-blue-600/20 mt-auto flex items-center justify-center gap-2 transition-all"
          >
            <Maximize size={20} /> Skip Timer & Start
          </button>
        </div>
      )}
    </>
  );
}