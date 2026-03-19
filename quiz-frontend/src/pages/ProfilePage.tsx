import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon,
  Mail,
  Shield,
  Loader2,
  Edit3,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Cake,
  Github,
  Linkedin,
  Twitter,
  Save,
  X,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useUser } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL;

const NAME_REGEX = /^[A-Za-z\s\-']{2,50}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const URL_REGEX =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [formData, setFormData] = useState<any>({});

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordStatus, setPasswordStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    if (!user?._id) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${user._id}`);
        const data = await res.json();

        if (data.success) {
          setProfileData(data.data);
          setFormData({
            name: data.data.name || "",
            gender: data.data.gender || "",
            birthday: data.data.birthday
              ? new Date(data.data.birthday).toISOString().split("T")[0]
              : "",
            work: data.data.work || "",
            experience: data.data.experience || "",
            education: data.data.education || "",
            skills: data.data.skills ? data.data.skills.join(", ") : "",
            socialLinks: {
              github: data.data.socialLinks?.github || "",
              linkedin: data.data.socialLinks?.linkedin || "",
              twitter: data.data.socialLinks?.twitter || "",
            },
          });
        } else {
          setError(data.message || "Failed to load profile.");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Failed to connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setProfileError("");

    if (name.startsWith("social_")) {
      const network = name.split("_")[1];
      setFormData((prev: any) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [network]: value },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const validateProfileData = () => {
    if (!NAME_REGEX.test(formData.name.trim())) {
      setProfileError(
        "Name must be 2-50 characters and contain only valid letters.",
      );
      return false;
    }
    const { github, linkedin, twitter } = formData.socialLinks;
    if (github && !URL_REGEX.test(github.trim())) {
      setProfileError("Please enter a valid GitHub URL.");
      return false;
    }
    if (linkedin && !URL_REGEX.test(linkedin.trim())) {
      setProfileError("Please enter a valid LinkedIn URL.");
      return false;
    }
    if (twitter && !URL_REGEX.test(twitter.trim())) {
      setProfileError("Please enter a valid Twitter URL.");
      return false;
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileData()) return;

    setIsSaving(true);
    try {
      const skillsArray = formData.skills
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s);
      const payload = {
        ...formData,
        name: formData.name.trim(),
        work: formData.work.trim(),
        education: formData.education.trim(),
        experience: formData.experience.trim(),
        skills: skillsArray,
        socialLinks: {
          github: formData.socialLinks.github.trim(),
          linkedin: formData.socialLinks.linkedin.trim(),
          twitter: formData.socialLinks.twitter.trim(),
        },
      };

      const res = await fetch(`${API_URL}/api/users/${user?._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setProfileData(data.data);
        setIsEditing(false);
      } else {
        setProfileError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setProfileError("An error occurred while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, error: "", success: "" });
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordStatus({
        loading: false,
        error: "All fields are required.",
        success: "",
      });
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordStatus({
        loading: false,
        error: "New passwords do not match.",
        success: "",
      });
      return;
    }
    if (!PASSWORD_REGEX.test(passwordData.new)) {
      setPasswordStatus({
        loading: false,
        error:
          "Password must be 8+ chars with an uppercase, lowercase, number, and special character.",
        success: "",
      });
      return;
    }
    if (passwordData.current === passwordData.new) {
      setPasswordStatus({
        loading: false,
        error: "New password must be different from the current one.",
        success: "",
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/${user?._id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setPasswordStatus({
          loading: false,
          error: "",
          success: "Password changed successfully!",
        });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordData({ current: "", new: "", confirm: "" });
          setPasswordStatus({ loading: false, error: "", success: "" });
        }, 2000);
      } else {
        setPasswordStatus({
          loading: false,
          error: data.message || "Failed to change password.",
          success: "",
        });
      }
    } catch (err) {
      setPasswordStatus({
        loading: false,
        error: "Server error. Please try again.",
        success: "",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">
          Loading Profile...
        </p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-6 rounded-2xl border border-red-200 dark:border-red-800 text-center max-w-md">
          <p className="font-bold mb-4">{error || "User not found."}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 p-4 md:p-8 font-sans pb-20">
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock size={20} className="text-violet-600" /> Change Password
                </h3>
                <button
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordData({ current: "", new: "", confirm: "" });
                    setPasswordStatus({
                      loading: false,
                      error: "",
                      success: "",
                    });
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                {passwordStatus.error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-200">
                    {passwordStatus.error}
                  </div>
                )}
                {passwordStatus.success && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-200">
                    {passwordStatus.success}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.current}
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        current: e.target.value,
                      });
                      setPasswordStatus((p) => ({ ...p, error: "" }));
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.new}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, new: e.target.value });
                      setPasswordStatus((p) => ({ ...p, error: "" }));
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirm}
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        confirm: e.target.value,
                      });
                      setPasswordStatus((p) => ({ ...p, error: "" }));
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordStatus.loading}
                  className="w-full py-3 mt-4 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                >
                  {passwordStatus.loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            My <span className="text-violet-600">Profile</span>
          </h1>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {profileError && (
              <div className="hidden md:flex items-center gap-2 text-sm text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50 animate-in slide-in-from-right">
                <AlertCircle size={14} /> {profileError}
              </div>
            )}

            {isEditing ? (
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setProfileError("");
                  }}
                  className="flex-1 md:flex-none px-4 py-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}{" "}
                  Save Changes
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-200 dark:hover:border-violet-800 transition-all shadow-sm"
              >
                <Edit3 size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>
        {profileError && (
          <div className="md:hidden flex items-start gap-2 text-sm text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800/50 animate-in slide-in-from-top">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />{" "}
            <p>{profileError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-br from-violet-500 to-indigo-600 opacity-90"></div>
              <div
                className={`relative w-28 h-28 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-4xl font-black text-white shadow-md z-10 mt-6 ${profileData.avatarColor || "bg-violet-500"}`}
              >
                {profileData.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
                {profileData.name}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-full text-xs font-bold uppercase tracking-wider mt-2 border border-violet-100 dark:border-violet-800/50">
                {profileData.role === "admin" ? (
                  <Shield size={12} />
                ) : (
                  <UserIcon size={12} />
                )}
                {profileData.role}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                Social Profiles
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <Github size={16} />
                  </div>
                  {isEditing ? (
                    <input
                      name="social_github"
                      type="url"
                      value={formData.socialLinks.github}
                      onChange={handleInputChange}
                      placeholder="https://github.com/..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:border-violet-500 outline-none"
                    />
                  ) : (
                    <a
                      href={profileData.socialLinks?.github || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-slate-500 hover:text-violet-600 truncate"
                    >
                      {profileData.socialLinks?.github || "Not added"}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <Linkedin size={16} />
                  </div>
                  {isEditing ? (
                    <input
                      name="social_linkedin"
                      type="url"
                      value={formData.socialLinks.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:border-violet-500 outline-none"
                    />
                  ) : (
                    <a
                      href={profileData.socialLinks?.linkedin || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-slate-500 hover:text-blue-600 truncate"
                    >
                      {profileData.socialLinks?.linkedin || "Not added"}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-500">
                    <Twitter size={16} />
                  </div>
                  {isEditing ? (
                    <input
                      name="social_twitter"
                      type="url"
                      value={formData.socialLinks.twitter}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:border-violet-500 outline-none"
                    />
                  ) : (
                    <a
                      href={profileData.socialLinks?.twitter || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-slate-500 hover:text-sky-500 truncate"
                    >
                      {profileData.socialLinks?.twitter || "Not added"}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <UserIcon size={14} /> Full Name
                  </label>
                  {isEditing ? (
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:border-violet-500 outline-none"
                    />
                  ) : (
                    <div className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {profileData.name}
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Mail size={14} /> Email Address
                  </label>
                  <div className="px-4 py-2.5 font-medium text-slate-500 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent cursor-not-allowed">
                    {profileData.email}{" "}
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <UserIcon size={14} /> Gender
                  </label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:border-violet-500 outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <div className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {profileData.gender || "Not specified"}
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Cake size={14} /> Birthday
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:border-violet-500 outline-none"
                    />
                  ) : (
                    <div className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {profileData.birthday
                        ? new Date(profileData.birthday).toLocaleDateString()
                        : "Not specified"}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                Professional & Academic
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Briefcase size={14} /> Current Role / Work
                  </label>
                  {isEditing ? (
                    <input
                      name="work"
                      value={formData.work}
                      onChange={handleInputChange}
                      placeholder="e.g. Software Engineer at Google"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:border-violet-500 outline-none"
                    />
                  ) : (
                    <div className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {profileData.work || "Not specified"}
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <GraduationCap size={14} /> Education
                  </label>
                  {isEditing ? (
                    <input
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      placeholder="e.g. B.Tech in CSE from IIT Delhi"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:border-violet-500 outline-none"
                    />
                  ) : (
                    <div className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {profileData.education || "Not specified"}
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Sparkles size={14} /> Skills
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        placeholder="React, Node.js, Python (comma separated)"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:border-violet-500 outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 pl-2">
                        Separate multiple skills with commas.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 px-4 py-2">
                      {profileData.skills?.length > 0 ? (
                        profileData.skills.map((skill: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-lg text-sm font-bold border border-violet-100 dark:border-violet-800/50"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 font-medium">
                          No skills added
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Briefcase size={14} /> Experience Details
                  </label>
                  {isEditing ? (
                    <textarea
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder="Briefly describe your past experiences and projects..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:border-violet-500 outline-none h-28 resize-none"
                    />
                  ) : (
                    <div className="px-4 py-2.5 font-medium text-slate-900 dark:text-white whitespace-pre-wrap">
                      {profileData.experience || "No experience details added."}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                Security
              </h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Password
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage your password and security.
                  </p>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  Change Password
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
