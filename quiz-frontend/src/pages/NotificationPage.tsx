import { useState, useMemo, useEffect } from "react";
import { 
  Bell, BookOpen, Trophy, Target, 
  Clock, CheckCircle2, Trash2, Filter, Loader2, AlertCircle, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCohort } from "../context/CohortContext";
import { useUser } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Quick helper to format MongoDB timestamps into "2 hours ago"
function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { activeCohort } = useCohort();
  const { user } = useUser();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Fetch Notifications on Mount
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_URL}/api/notifications/user/${user._id}`);
        const data = await res.json();
        
        if (data.success) {
          setNotifications(data.data);
        } else {
          setError(data.message || "Failed to load notifications.");
        }
      } catch (err) {
        setError("Network error. Could not fetch notifications.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  // 2. Filter dynamically: Include active cohort AND System notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => n.cohort === activeCohort || n.cohort === "System");
  }, [activeCohort, notifications]);

  // 3. Mark Single as Read (Optimistic Update)
  const markAsRead = async (id: string) => {
    // Update UI instantly
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    
    // Send background request
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark as read in DB");
    }
  };

  // 4. Mark All as Read (Optimistic Update)
  const markAllAsRead = async () => {
    // Update UI instantly for all filtered items (Cohort + System)
    setNotifications(prev => prev.map(n => 
      (n.cohort === activeCohort || n.cohort === "System") ? { ...n, isRead: true } : n
    ));

    // Send background request
    try {
      await fetch(`${API_URL}/api/notifications/user/${user?._id}/read-all`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark all as read in DB");
    }
  };

  // 5. Delete Notification (Optimistic Update)
  const deleteNotification = async (id: string) => {
    // Update UI instantly
    setNotifications(prev => prev.filter(n => n._id !== id));

    // Send background request
    try {
      await fetch(`${API_URL}/api/notifications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete notification in DB");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Loading Updates...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Bell className="text-blue-600" /> Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Updates for <span className="text-blue-600 dark:text-blue-400 font-bold">{activeCohort}</span> & System
          </p>
        </div>
        
        {filteredNotifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-2 font-bold text-sm border border-red-100 dark:border-red-800">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Notification List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationItem 
                key={notification._id} 
                item={notification} 
                onRead={markAsRead} 
                onDelete={deleteNotification}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-4xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                <Filter className="text-slate-400" size={28} />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">No notifications here.</p>
              <p className="text-sm text-slate-400 mt-2 font-medium">Switch cohorts in the sidebar to view other updates.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Sub-Component: Individual Notification Card ---

function NotificationItem({ item, onRead, onDelete }: any) {
  // Determine if it's a system notification
  const isSystem = item.cohort === "System";

  const iconMap: any = {
    theory: { icon: <BookOpen size={18} />, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    quiz: { icon: <Target size={18} />, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
    achievement: { icon: <Trophy size={18} />, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
    result: { icon: <CheckCircle2 size={18} />, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
    system: { icon: <ShieldCheck size={18} />, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" }
  };

  // Force 'system' config if cohort is System, otherwise use item type or fallback
  const config = isSystem ? iconMap.system : (iconMap[item.type] || iconMap.theory);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative group flex items-start gap-4 p-5 rounded-2xl border transition-all ${
        item.isRead 
          ? "bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800" 
          : "bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/40 shadow-md shadow-blue-500/5"
      }`}
    >
      {/* Read/Unread Indicator */}
      {!item.isRead && (
        <div className="absolute top-7 left-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
      )}

      {/* Icon */}
      <div className={`p-3 rounded-xl shrink-0 ${config.color}`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-sm md:text-base ${item.isRead ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white"}`}>
              {item.title}
            </h3>
            {/* System Badge */}
            {isSystem && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                System
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider shrink-0">
            <Clock size={12} /> {getTimeAgo(item.createdAt)}
          </span>
        </div>
        <p className={`text-sm mt-1 leading-relaxed ${item.isRead ? "text-slate-500 dark:text-slate-500" : "text-slate-600 dark:text-slate-300"}`}>
          {item.message}
        </p>
        
        <div className="mt-4 flex items-center gap-4">
          {!item.isRead && (
            <button 
              onClick={() => onRead(item._id)}
              className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              Mark as read
            </button>
          )}
          <button 
            onClick={() => onDelete(item._id)}
            className="text-xs font-black text-slate-400 hover:text-red-500 dark:hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}