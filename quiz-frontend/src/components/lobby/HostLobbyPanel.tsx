import { Users, Copy, Link as LinkIcon, Mail, Trash2, Maximize, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HostLobbyPanelProps {
  activeRoomCode: string;
  copiedCode: boolean;
  copiedLink: boolean;
  handleCopyCode: () => void;
  handleCopyLink: () => void;
  handleEmail: () => void;
  liveParticipants: any[];
  user: any;
  handleKickParticipant: (id: string) => void;
  isHostTakingQuiz: boolean;
  setIsHostTakingQuiz: (val: boolean) => void;
  handleDeleteRoom: () => void;
  handleHostStart: () => void;
  hasMultipleDisplays: boolean;
}

export default function HostLobbyPanel({
  activeRoomCode,
  copiedCode,
  copiedLink,
  handleCopyCode,
  handleCopyLink,
  handleEmail,
  liveParticipants,
  user,
  handleKickParticipant,
  isHostTakingQuiz,
  setIsHostTakingQuiz,
  handleDeleteRoom,
  handleHostStart,
  hasMultipleDisplays,
}: HostLobbyPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Users className="text-blue-500 dark:text-blue-400" /> Live Lobby Hub
      </h3>

      <div className="bg-linear-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-3xl p-6 text-white text-center shadow-lg dark:shadow-blue-900/30 relative overflow-hidden mb-6 border border-transparent dark:border-blue-800/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <p className="text-blue-200 dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">
          Room Code
        </p>
        <p className="text-5xl font-black tracking-[0.15em] mb-6 relative z-10">
          {activeRoomCode}
        </p>

        <div className="flex justify-center gap-3 relative z-10">
          <button
            onClick={handleCopyCode}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${copiedCode ? "bg-emerald-500 text-white" : "bg-white/20 hover:bg-white/30 text-white"}`}
          >
            {copiedCode ? <Check size={16} /> : <Copy size={16} />} {copiedCode ? "Copied!" : "Code"}
          </button>
          <button
            onClick={handleCopyLink}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${copiedLink ? "bg-emerald-500 text-white" : "bg-white/20 hover:bg-white/30 text-white"}`}
          >
            {copiedLink ? <Check size={16} /> : <LinkIcon size={16} />} {copiedLink ? "Copied!" : "Link"}
          </button>
          <button
            onClick={handleEmail}
            className="flex items-center justify-center p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
          >
            <Mail size={16} />
          </button>
        </div>
      </div>

      <div className="mb-6 grow flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Participants
          </p>
          <span className="bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {liveParticipants.length} Joined
          </span>
        </div>

        <div className="space-y-2 overflow-y-auto pr-2 grow scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {liveParticipants.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500">
              Waiting for peers to join...
            </div>
          ) : (
            <AnimatePresence>
              {liveParticipants.map((p) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={p.userId}
                  className="flex justify-between items-center text-sm p-3.5 border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/40 rounded-xl group"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
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
                  {p.userId !== user?._id && (
                    <button
                      onClick={() => handleKickParticipant(p.userId)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove Player"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
          <input
            type="checkbox"
            checked={isHostTakingQuiz}
            onChange={(e) => setIsHostTakingQuiz(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 dark:bg-slate-900 focus:ring-blue-500"
          />
          <div className="text-sm">
            <p className="font-bold text-slate-900 dark:text-white">
              I am also participating
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Uncheck to access the Proctoring Dashboard instead.
            </p>
          </div>
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDeleteRoom}
            className="w-full sm:w-auto px-6 py-4 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={20} /> <span className="hidden sm:inline">Delete</span>
          </button>
          <button
            onClick={handleHostStart}
            disabled={hasMultipleDisplays || liveParticipants.length === 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:dark:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg dark:shadow-blue-600/20 transition-all flex items-center justify-center gap-2 flex-1"
          >
            <Maximize size={20} /> Start Quiz for All
          </button>
        </div>
      </div>
    </div>
  );
}