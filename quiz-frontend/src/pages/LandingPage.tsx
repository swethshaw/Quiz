import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  Trophy,
  Zap,
  BookOpen,
  LayoutGrid,
  ChevronRight,
  Target,
  Rocket,
  ShieldCheck,
  Code
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-sans overflow-x-hidden selection:bg-violet-500/30">
      <Navbar />
      <main>
        <HeroSection />
        <GamificationSection />
        <FeaturesSection />
        <ProjectManagementSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-linear-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <BookOpen size={22} />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            PeerLearning
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden md:block font-bold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all hover:-translate-y-0.5 shadow-md"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-150 h-150 bg-violet-600/10 dark:bg-violet-600/20 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-125 h-125 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 mb-8 text-xs font-black tracking-widest uppercase border border-violet-200 dark:border-violet-800/50 shadow-sm"
        >
          <Zap size={14} className="text-amber-500" fill="currentColor" />
          The Ultimate Cohort-Based Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-slate-900 dark:text-white leading-tight"
        >
          Learn, Test, and Build. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-600 to-indigo-500">
            Together.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto font-medium"
        >
          Join a cohort, host live peer quizzes, and build real-world projects by dividing them into modules and collaborating with the best minds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto bg-linear-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:-translate-y-1 transition-all shadow-xl shadow-violet-500/30 flex items-center justify-center gap-2"
          >
            Join a Cohort <ChevronRight size={20} />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 shadow-sm"
          >
            Explore Projects
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function GamificationSection() {
  return (
    <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <Stat icon={<Target className="text-emerald-500" />} value="98%" label="Average Accuracy" />
          <Stat icon={<Users className="text-blue-500" />} value="10k+" label="Active Peers" />
          <Stat icon={<Trophy className="text-amber-500" />} value="#1" label="Global Leaderboards" />
          <Stat icon={<Rocket className="text-violet-500" />} value="500+" label="Projects Shipped" />
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: any) {
  return (
    <div className="flex flex-col items-center justify-center group">
      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm border border-slate-100 dark:border-slate-700">
        {icon}
      </div>
      <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</h4>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
            An Arena for <span className="text-violet-600 dark:text-violet-400">Continuous Growth</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Stop learning in isolation. PeerLearning forces you to engage, compete, and prove your skills in real-time environments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<LayoutGrid size={28} className="text-blue-500" />}
            bg="bg-blue-50 dark:bg-blue-500/10"
            border="border-blue-100 dark:border-blue-900/50"
            title="Theory Mastery"
            description="Complete structured modules tailored to your cohort. Track your progress with detailed analytics and heatmaps."
          />
          <FeatureCard 
            icon={<Zap size={28} className="text-amber-500" fill="currentColor" />}
            bg="bg-amber-50 dark:bg-amber-500/10"
            border="border-amber-100 dark:border-amber-900/50"
            title="Live Peer Quizzes"
            description="Host a session or jump into active lobbies. Compete against your peers in real-time, timed assessments."
          />
          <FeatureCard 
            icon={<Trophy size={28} className="text-emerald-500" />}
            bg="bg-emerald-50 dark:bg-emerald-500/10"
            border="border-emerald-100 dark:border-emerald-900/50"
            title="Global Rankings"
            description="Earn XP for every correct answer. Climb the global and cohort-specific leaderboards to prove your expertise."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, bg, border, title, description }: any) {
  return (
    <div className={`p-8 rounded-4xl border ${border} bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group`}>
      <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function ProjectManagementSection() {
  return (
    <section className="py-24 px-6 bg-slate-900 dark:bg-black text-white rounded-[3rem] mx-4 md:mx-8 my-12 relative overflow-hidden shadow-2xl">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 text-xs font-black tracking-widest uppercase">
              <Code size={14} className="text-emerald-400" />
              The Marketplace
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Don't just code alone.<br/>
              <span className="text-violet-400">Host & Hire your peers.</span>
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Have a big idea? Break your project into smaller components and host it on the platform. Review portfolios, shortlist applicants, and assign tasks to your cohort.
            </p>

            <ul className="space-y-5">
              <ListItem text="Filter participants by Cohort and specific Roles (e.g., UI, Backend)." />
              <ListItem text="Secure submission gateways for PR links and design files." />
              <ListItem text="Built-in Review & Feedback loop for task approval." />
            </ul>
          </div>

          <div className="relative">
            <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <h4 className="font-black flex items-center gap-2"><ShieldCheck className="text-violet-500"/> Host Workspace</h4>
                <span className="text-[10px] uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">Active Cohort</span>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">Database Schema Design</p>
                    <p className="text-xs text-slate-500 mt-1">Component 1 • 3 Applicants</p>
                  </div>
                  <button className="text-xs bg-white text-black px-4 py-2 rounded-lg font-bold">Review</button>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">Auth Implementation</p>
                    <p className="text-xs text-emerald-500 mt-1">Assigned • In Progress</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-900">JD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
        <div className="w-2 h-2 bg-violet-500 rounded-full" />
      </div>
      <span className="text-slate-200 font-medium">{text}</span>
    </li>
  );
}

function CTASection() {
  return (
    <section className="py-24 text-center px-6">
      <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6">Ready to enter the arena?</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto font-medium">
        Join thousands of students learning, competing, and building together. Your cohort is waiting for you.
      </p>
      <Link
        to="/register"
        className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-black text-lg hover:-translate-y-1 transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10"
      >
        Create Free Account <Rocket size={20} />
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white">
            <BookOpen size={16} />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            PeerLearning
          </span>
        </div>
        <p className="text-slate-500 font-medium text-sm">
          © {new Date().getFullYear()} PeerLearning. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm font-bold text-slate-500">
          <Link to="/help" className="hover:text-violet-600 transition-colors">Help Center</Link>
          <Link to="/login" className="hover:text-violet-600 transition-colors">Sign In</Link>
        </div>
      </div>
    </footer>
  );
}