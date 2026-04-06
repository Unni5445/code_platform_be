import { useCallback, useState } from "react";
import {
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Calendar,
  Flame,
  Trophy,
  BookOpen,
  User,
  Award,
  Clock,
  CheckCircle,
  Zap,
  Crown,
  Target,
  Share2,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { enrollmentService } from "@/services";
import { Card, Avatar, Badge, StatCard, Spinner, Button } from "@/components/ui";
import { ActivityHeatmap } from "@/components/activity/ActivityHeatmap";
import type { IEnrollment } from "@/types";
import type { ICertificate } from "@/services/enrollment.service";
import toast from "react-hot-toast";

// ─── Level System ───
function getLevel(points: number) {
  if (points >= 10000) return { level: 50, title: "Legendary Coder", color: "text-amber-300", bg: "from-amber-500/30 to-orange-500/30", border: "border-amber-500/40" };
  if (points >= 5000) return { level: 40, title: "Grand Master", color: "text-purple-300", bg: "from-purple-500/30 to-pink-500/30", border: "border-purple-500/40" };
  if (points >= 2000) return { level: 30, title: "Champion", color: "text-emerald-300", bg: "from-emerald-500/30 to-teal-500/30", border: "border-emerald-500/40" };
  if (points >= 1000) return { level: 20, title: "Warrior", color: "text-sky-300", bg: "from-sky-500/30 to-blue-500/30", border: "border-sky-500/40" };
  if (points >= 500) return { level: 15, title: "Fighter", color: "text-primary-300", bg: "from-primary-500/30 to-secondary-500/30", border: "border-primary-500/40" };
  if (points >= 200) return { level: 10, title: "Apprentice", color: "text-slate-200", bg: "from-slate-500/30 to-zinc-500/30", border: "border-slate-500/40" };
  return { level: Math.max(1, Math.floor(points / 20)), title: "Novice", color: "text-slate-300", bg: "from-slate-600/30 to-slate-700/30", border: "border-slate-600/40" };
}

function getNextLevelXP(points: number) {
  const thresholds = [200, 500, 1000, 2000, 5000, 10000];
  for (const t of thresholds) {
    if (points < t) return t;
  }
  return points + 1000;
}

// ─── Badges ───
interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

function getBadges(points: number, streak: number, maxStreak: number, completedCourses: number): ProfileBadge[] {
  return [
    { id: "first-blood", name: "First Blood", description: "Complete your first quest", icon: "⚔️", earned: points > 0, rarity: "common" },
    { id: "streak-3", name: "On Fire", description: "Achieve a 3-day streak", icon: "🔥", earned: maxStreak >= 3, rarity: "common" },
    { id: "streak-7", name: "Unstoppable", description: "Achieve a 7-day streak", icon: "💪", earned: maxStreak >= 7, rarity: "rare" },
    { id: "streak-30", name: "Iron Will", description: "Achieve a 30-day streak", icon: "🏆", earned: maxStreak >= 30, rarity: "epic" },
    { id: "xp-500", name: "Rising Star", description: "Earn 500 XP", icon: "⭐", earned: points >= 500, rarity: "common" },
    { id: "xp-2000", name: "Code Warrior", description: "Earn 2000 XP", icon: "🗡️", earned: points >= 2000, rarity: "rare" },
    { id: "xp-5000", name: "Grand Master", description: "Earn 5000 XP", icon: "👑", earned: points >= 5000, rarity: "epic" },
    { id: "xp-10000", name: "Legend", description: "Earn 10000 XP", icon: "🐉", earned: points >= 10000, rarity: "legendary" },
    { id: "course-1", name: "Scholar", description: "Complete a course", icon: "📚", earned: completedCourses >= 1, rarity: "common" },
    { id: "course-3", name: "Knowledge Seeker", description: "Complete 3 courses", icon: "🎓", earned: completedCourses >= 3, rarity: "rare" },
    { id: "hot-streak", name: "Hot Streak", description: "Current streak of 5+", icon: "🌟", earned: streak >= 5, rarity: "rare" },
    { id: "perfectionist", name: "Perfectionist", description: "Score 100% on 5 problems", icon: "💎", earned: points >= 1000, rarity: "epic" },
  ];
}

const rarityBorder: Record<string, string> = {
  common: "border-slate-600/50",
  rare: "border-sky-500/40",
  epic: "border-purple-500/40",
  legendary: "border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
};

const rarityBg: Record<string, string> = {
  common: "bg-slate-800/60",
  rare: "bg-sky-500/5",
  epic: "bg-purple-500/5",
  legendary: "bg-amber-500/5",
};

// ─── Skill Radar (CSS-based) ───
function SkillRadar() {
  const skills = [
    { name: "Arrays", value: 85 },
    { name: "Strings", value: 70 },
    { name: "Trees", value: 55 },
    { name: "DP", value: 40 },
    { name: "Graphs", value: 30 },
    { name: "Sort", value: 90 },
  ];

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-50 mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary-400" />
        Skill Radar
      </h3>
      <div className="space-y-3">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300">{skill.name}</span>
              <span className="text-xs font-medium text-slate-400">{skill.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-700"
                style={{ width: `${skill.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Main Profile Page ───
export default function ProfilePage() {
  const { user } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchEnrollments = useCallback(() => enrollmentService.getMyEnrollments(), []);
  const { data: enrollments } = useApi<IEnrollment[]>(fetchEnrollments, []);

  const fetchCertificates = useCallback(() => enrollmentService.getMyCertificates(), []);
  const { data: certificates, loading: certsLoading } = useApi<ICertificate[]>(
    fetchCertificates,
    []
  );

  const points = user?.points || 0;
  const streak = user?.streak || 0;
  const maxStreak = user?.maxStreak || 0;
  const completedCount = enrollments?.filter((e) => e.status === "COMPLETED").length || 0;
  const activeCount = enrollments?.filter((e) => e.status === "ACTIVE").length || 0;

  const level = getLevel(points);
  const nextLevelXP = getNextLevelXP(points);
  const progressToNext = Math.min(100, Math.round((points / nextLevelXP) * 100));
  const badges = getBadges(points, streak, maxStreak, completedCount);
  const earnedBadges = badges.filter((b) => b.earned);

  const orgName =
    user?.organisation && typeof user.organisation === "object"
      ? user.organisation.name
      : user?.organisation;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleCopyLink = () => {
    const profileUrl = `${window.location.origin}/profile/${user?._id || ""}`;
    navigator.clipboard.writeText(profileUrl);
    setLinkCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const infoItems = [
    { icon: Mail, label: "Email", value: user?.email },
    { icon: Phone, label: "Phone", value: user?.phone },
    { icon: User, label: "Gender", value: user?.gender },
    { icon: Calendar, label: "Date of Birth", value: formatDate(user?.dob) },
    { icon: Building2, label: "College", value: orgName },
    { icon: GraduationCap, label: "Department", value: user?.department },
    { icon: Calendar, label: "Passout Year", value: user?.passoutYear?.toString() },
    { icon: Clock, label: "Member Since", value: formatDate(user?.createdAt) },
  ].filter((item) => item.value);

  return (
    <div className="space-y-6">
      {/* Hero Card - Level + Identity */}
      <div className="relative overflow-hidden rounded-2xl mc-glass p-6">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar + Level ring */}
          <div className="relative">
            <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-br ${level.bg} ${level.border} border-2`} />
            <Avatar name={user?.name} size="lg" className="relative h-20 w-20 text-2xl" />
            <div className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border-2 ${level.border}`}>
              <span className="text-xs font-bold text-white">{level.level}</span>
            </div>
          </div>

          {/* Name + Class */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-white">{user?.name || "Student"}</h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${level.bg} ${level.border} ${level.color}`}>
                <Crown className="h-3 w-3" />
                {level.title}
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-2">{user?.email}</p>

            {/* XP Progress */}
            <div className="max-w-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  {points} / {nextLevelXP} XP
                </span>
                <span className="text-xs text-slate-500">Next level</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-700"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          </div>

          {/* Share Button */}
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            leftIcon={linkCopied ? <CheckCircle className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          >
            {linkCopied ? "Copied!" : "Share Profile"}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Zap}
          label="Total XP"
          value={points}
          color="bg-amber-500/20 text-amber-300"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={streak}
          color="bg-orange-500/20 text-orange-300"
        />
        <StatCard
          icon={Trophy}
          label="Max Streak"
          value={maxStreak}
          color="bg-red-500/20 text-red-300"
        />
        <StatCard
          icon={Award}
          label="Badges"
          value={earnedBadges.length}
          color="bg-purple-500/20 text-purple-300"
        />
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={enrollments?.length || 0}
          color="bg-sky-500/20 text-sky-300"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completedCount}
          color="bg-emerald-500/20 text-emerald-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Badge Collection */}
          <Card header={
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Badge Collection
              </h3>
              <span className="text-xs text-slate-400">{earnedBadges.length}/{badges.length} earned</span>
            </div>
          }>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-xl border p-3 text-center transition-all duration-300 ${
                    badge.earned
                      ? `${rarityBg[badge.rarity]} ${rarityBorder[badge.rarity]} hover:scale-105`
                      : "border-slate-800/40 bg-slate-900/30 opacity-40 grayscale"
                  }`}
                >
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <p className="text-xs font-medium text-white truncate">{badge.name}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{badge.description}</p>
                  {badge.earned && (
                    <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider ${
                      badge.rarity === "legendary" ? "text-amber-400" :
                      badge.rarity === "epic" ? "text-purple-400" :
                      badge.rarity === "rare" ? "text-sky-400" : "text-slate-500"
                    }`}>
                      {badge.rarity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Heatmap */}
          <Card header={<h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Flame className="h-5 w-5 text-emerald-400" />
            Activity Heatmap
          </h3>}>
            <ActivityHeatmap data={user?.activityLog || []} />
          </Card>

          {/* Personal Info */}
          <Card header={<h3 className="text-lg font-semibold text-white">Personal Information</h3>}>
            {infoItems.length === 0 ? (
              <p className="text-sm text-slate-400">No personal information available</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {infoItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3"
                  >
                    <div className="rounded-lg bg-slate-900/80 p-2">
                      <item.icon className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-medium text-white">{String(item.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Skill Radar */}
          <SkillRadar />

          {/* Certificates */}
          <Card header={
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-400" />
              Certificates
            </h3>
          }>
            {certsLoading ? (
              <div className="flex justify-center py-6">
                <Spinner size="md" />
              </div>
            ) : !certificates?.length ? (
              <p className="text-sm text-slate-400">
                Complete a course to earn your first certificate!
              </p>
            ) : (
              <div className="space-y-2">
                {certificates.map((cert) => {
                  const courseTitle =
                    typeof cert.course === "object" ? cert.course.title : "Course";
                  const courseId =
                    typeof cert.course === "object" ? cert.course._id : cert.course;
                  return (
                    <Link
                      key={cert._id}
                      to={`/certificates/${courseId}`}
                      className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-3 transition-colors hover:bg-emerald-500/20"
                    >
                      <div className="rounded-lg bg-slate-900/80 p-2">
                        <Award className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{cert.title}</p>
                        <p className="text-xs text-slate-400">
                          {courseTitle} - {formatDate(cert.issuedAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
