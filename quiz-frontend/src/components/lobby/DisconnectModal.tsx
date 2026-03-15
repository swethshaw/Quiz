import { motion, AnimatePresence } from "framer-motion";
import { XCircle, LogOut, Loader2 } from "lucide-react";

interface DisconnectModalProps {
  isKicked: boolean;
  hostLeft: boolean;
}

export default function DisconnectModal({ isKicked, hostLeft }: DisconnectModalProps) {
  return (
    <AnimatePresence>
      {(isKicked || hostLeft) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-slate-900/80 dark:bg-[#0B0F19]/80 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800"
          >
            {isKicked ? (
              <XCircle className="text-red-500 mb-4 mx-auto" size={56} />
            ) : (
              <LogOut className="text-amber-500 mb-4 mx-auto" size={56} />
            )}
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              {isKicked ? "You were removed" : "Session Ended"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {isKicked
                ? "The host has removed you from this lobby."
                : "The host has closed the lobby or disconnected."}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
              <Loader2 className="animate-spin" size={16} /> Redirecting...
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}