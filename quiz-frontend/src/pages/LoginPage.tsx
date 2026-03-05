import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useUser } from "../context/UserContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.data);
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Cannot connect to server. Is your backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700"
      >
        <div className="w-16 h-16 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <ShieldCheck size={32} />
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-center text-slate-900 dark:text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">
          Please log in to continue your learning journey.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-slate-400" size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="alex@example.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs font-bold mt-2 animate-pulse">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <LogIn size={20} /> Access Account
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400 font-medium">Demo Account:</p>
          <p
            className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-1 cursor-pointer hover:text-blue-500"
            onClick={() => setEmail("alex@example.com")}
          >
            alex@example.com
          </p>
        </div>
      </motion.div>
    </div>
  );
}
