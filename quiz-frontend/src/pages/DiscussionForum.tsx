import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, ThumbsUp, ArrowLeft, Send, Bug, 
  Lightbulb, BookOpen, Search, UserCircle, Loader2, Clock 
} from "lucide-react";
import { useUser } from "../context/UserContext";

// Fixed: Removed double semicolon
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DiscussionForum() {
  const { user } = useUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    // Ensure loading starts as true
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/help/tickets`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      // Fixed: Must set to FALSE so the component renders the data
      setIsLoading(false); 
    }
  };

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/help/tickets/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await res.json();
      if (data.success) {
        // Find the ticket in the local list and update its data
        setTickets(prev => prev.map(t => t._id === id ? data.data : t));
      }
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !selectedTicketId) return;

    try {
      const res = await fetch(`${API_URL}/api/help/tickets/${selectedTicketId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user._id, 
          userName: user.name, 
          text: newComment 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets(prev => prev.map(t => t._id === selectedTicketId ? data.data : t));
        setNewComment("");
      }
    } catch (err) { console.error(err); }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "website_bug": return { icon: <Bug size={14} />, color: "text-red-600 bg-red-50 dark:bg-red-900/20", label: "Bug" };
      case "improvement": return { icon: <Lightbulb size={14} />, color: "text-green-600 bg-green-50 dark:bg-green-900/20", label: "Idea" };
      case "question_error": return { icon: <BookOpen size={14} />, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", label: "Q-Error" };
      default: return { icon: <MessageSquare size={14} />, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", label: "Discussion" };
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeTicket = tickets.find(t => t._id === selectedTicketId);

  // Added a skeleton or centered loader for better UX
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 font-bold animate-pulse">Loading community discussions...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Community Forum</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Discuss issues, share ideas, and help your peers.</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedTicketId ? (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search tickets by keyword..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all" 
              />
            </div>

            <div className="space-y-4">
              {filteredTickets.length > 0 ? filteredTickets.map(ticket => {
                const config = getTypeConfig(ticket.reportType);
                const isLiked = ticket.likes?.includes(user?._id);
                return (
                  <motion.div 
                    key={ticket._id} 
                    layoutId={ticket._id}
                    onClick={() => setSelectedTicketId(ticket._id)} 
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${config.color}`}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ticket.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{ticket.description}</p>
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <UserCircle size={18} className="text-slate-400" /> {ticket.userName}
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => handleLike(e, ticket._id)} 
                          className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${isLiked ? "text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-blue-500"}`}
                        >
                          <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} /> {ticket.likes?.length || 0}
                        </button>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
                          <MessageSquare size={16} /> {ticket.comments?.length || 0}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 font-medium">No discussions found matching your search.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          activeTicket && (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <button 
                onClick={() => setSelectedTicketId(null)} 
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-4"
              >
                <ArrowLeft size={16} /> Back to Forum
              </button>
              
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="mb-4">
                   <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${getTypeConfig(activeTicket.reportType).color}`}>
                    {getTypeConfig(activeTicket.reportType).icon} {getTypeConfig(activeTicket.reportType).label}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4">{activeTicket.title}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8 text-lg">{activeTicket.description}</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 gap-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold uppercase">{activeTicket.userName?.[0]}</div>
                     <div>
                       <p className="text-sm font-bold text-slate-900 dark:text-white">{activeTicket.userName}</p>
                       <p className="text-xs text-slate-500">Original Poster</p>
                     </div>
                   </div>
                   <button 
                    onClick={(e) => handleLike(e, activeTicket._id)} 
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTicket.likes?.includes(user?._id) ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"}`}
                   >
                     <ThumbsUp size={18} fill={activeTicket.likes?.includes(user?._id) ? "currentColor" : "none"} /> 
                     {activeTicket.likes?.includes(user?._id) ? "Liked" : "Like"} ({activeTicket.likes?.length || 0})
                   </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare size={20} className="text-blue-500" />
                  Peers Feedback ({activeTicket.comments?.length || 0})
                </h3>
                
                {activeTicket.comments?.map((comment: any) => (
                  <div key={comment._id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold uppercase">{comment.userName?.[0]}</div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{comment.userName}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{comment.text}</p>
                  </div>
                ))}

                <form onSubmit={handleAddComment} className="mt-8 flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="Contribute to this discussion..." 
                    className="flex-1 px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm" 
                  />
                  <button 
                    type="submit" 
                    disabled={!newComment.trim()} 
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none active:scale-95"
                  >
                    <Send size={18} /> Post
                  </button>
                </form>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}