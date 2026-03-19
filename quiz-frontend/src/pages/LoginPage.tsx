import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Mail, Lock, Eye, EyeOff, 
  ArrowRight, GraduationCap, AlertCircle, Loader2, ShieldAlert
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  
  const { login } = useUser();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isLockedOut && lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (isLockedOut && lockoutTimer <= 0) {
      setIsLockedOut(false);
      setFailedAttempts(0);
      setErrorMsg("");
    }
    return () => clearInterval(timer);
  }, [isLockedOut, lockoutTimer]);

  const validateInputs = () => {
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMsg("Please enter a valid email address format.");
      return false;
    }
    if (!password) {
      setErrorMsg("Password is required.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) {
      setErrorMsg(`Too many failed attempts. Try again in ${lockoutTimer}s.`);
      return;
    }
    if (!validateInputs()) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(),
          password: password 
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFailedAttempts(0);
        login(data.data); 
      } else {
        handleFailedAttempt(data.message || "Invalid credentials.");
      }
    } catch (err) {
      setErrorMsg("Cannot connect to server. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailedAttempt = (serverMessage: string) => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    console.warn(`Login failed: ${serverMessage}. Attempt ${newAttempts}/${MAX_FAILED_ATTEMPTS}`);
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      setIsLockedOut(true);
      setLockoutTimer(LOCKOUT_DURATION_MS / 1000);
      setErrorMsg(`Account temporarily locked due to multiple failed attempts. Try again in 30 seconds.`);
    } else {
      setErrorMsg("Invalid email or password.");
    }
  };

  const handleGoogleLogin = () => {
    console.log("Initiating Google Login...");
  };

  const loadDemoAccount = () => {
    setEmail("alex@example.com");
    setPassword("demo1234");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F7FE] dark:bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-violet-500/20 dark:bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 dark:bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-4xl shadow-2xl shadow-violet-500/10 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-linear-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/30 mb-4">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium text-center">
            Log in to continue your learning journey.
          </p>
        </div>

        {errorMsg && (
          <div className={`mb-4 p-3 border rounded-xl flex items-start gap-2 text-sm font-bold animate-in slide-in-from-top-2 ${isLockedOut ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400'}`}>
            {isLockedOut ? <ShieldAlert size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <p className="leading-tight">{errorMsg}</p>
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          type="button"
          disabled={isLockedOut}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800 rounded-xl text-slate-700 dark:text-slate-200 font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:pointer-events-none group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
          <span className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or</span>
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
              <input 
                type="email" 
                required
                disabled={isLockedOut}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                placeholder="student@college.edu"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Password</label>
              <a href="#" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">Forgot?</a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                disabled={isLockedOut}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-400 tracking-wider disabled:opacity-50"
              />
              <button 
                type="button"
                disabled={isLockedOut}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !email || !password || isLockedOut}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 dark:disabled:bg-violet-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/25 active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isLockedOut ? (
              `Locked (${lockoutTimer}s)`
            ) : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-4">
          <div>
            <p className="text-xs text-slate-400 font-medium">Testing the app?</p>
            <button 
              type="button"
              disabled={isLockedOut}
              onClick={loadDemoAccount}
              className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-50"
            >
              Load Demo Credentials
            </button>
          </div>
          
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            New to PeerLearning?{" "}
            <Link to="/register" className="font-bold text-violet-600 dark:text-violet-400 hover:underline">
              Create an account
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
}