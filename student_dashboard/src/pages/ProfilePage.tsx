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
import { Card, Avatar, Badge, StatCard, Spinner, Button, EmptyState } from "@/components/ui";
import { ActivityHeatmap } from "@/components/activity/ActivityHeatmap";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import type { IEnrollment } from "@/types";
import type { ICertificate } from "@/services/enrollment.service";
import toast from "react-hot-toast";

// ─── Level System ───
function getLevel(points: number) {
  if (points >= 10000) return { level: 50, title: "Legendary Coder", color: "text-amber-700", bg: "from-amber-100 to-orange-100", border: "border-amber-200" };
  if (points >= 5000) return { level: 40, title: "Grand Master", color: "text-purple-700", bg: "from-purple-100 to-pink-100", border: "border-purple-200" };
  if (points >= 2000) return { level: 30, title: "Champion", color: "text-emerald-700", bg: "from-emerald-100 to-teal-100", border: "border-emerald-200" };
  if (points >= 1000) return { level: 20, title: "Warrior", color: "text-sky-700", bg: "from-sky-100 to-blue-100", border: "border-sky-200" };
  if (points >= 500) return { level: 15, title: "Fighter", color: "text-primary-700", bg: "from-primary-100 to-secondary-100", border: "border-primary-200" };
  if (points >= 200) return { level: 10, title: "Apprentice", color: "text-slate-700", bg: "from-slate-100 to-zinc-100", border: "border-slate-200" };
  return { level: Math.max(1, Math.floor(points / 20)), title: "Novice", color: "text-slate-600", bg: "from-slate-50 to-slate-100", border: "border-slate-200" };
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
  common: "border-slate-200",
  rare: "border-sky-300",
  epic: "border-purple-300",
  legendary: "border-amber-300 shadow-[0_4px_15px_rgba(245,158,11,0.1)]",
};

const rarityBg: Record<string, string> = {
  common: "bg-slate-100",
  rare: "bg-sky-100",
  epic: "bg-purple-100",
  legendary: "bg-amber-100",
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
      <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary-500" />
        Skill Radar
      </h3>
      <div className="space-y-3">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-600">{skill.name}</span>
              <span className="text-xs font-medium text-slate-500">{skill.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary-500 to-secondary-500 transition-all duration-700"
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  const level = getLevel(points);
  const nextLevelXP = getNextLevelXP(points);
  const progressToNext = Math.min(100, Math.round((points / nextLevelXP) * 100));
  const badges = getBadges(points, streak, maxStreak, completedCount);
  const earnedBadges = badges.filter((b) => b.earned);

  const orgName =
    user?.organisation && typeof user.organisation === "object"
      ? (user.organisation as any).name
      : user?.organisation;

  const formatDate = (dateStr?: string | Date) => {
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
    <div className="space-y-8 pb-10">
      {/* Hero Card - Level + Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl p-8 transition-all duration-500 hover:shadow-2xl group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-50 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-secondary-50 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
 
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Avatar + Level ring */}
          <div className="relative shrink-0">
            <div className={`absolute -inset-2 rounded-full bg-linear-to-br ${level.bg} ${level.border} border-2 shadow-lg shadow-primary-500/10`} />
            <Avatar name={user?.name} size="lg" className="relative h-24 w-24 text-3xl border-4 border-white shadow-sm" />
            <div className={`absolute -bottom-1 right-0 flex h-9 w-9 items-center justify-center rounded-2xl bg-white border-2 border-slate-200 shadow-xl ${level.border}`}>
              <span className="text-xs font-extra-black text-slate-900">{level.level}</span>
            </div>
          </div>
 
          {/* Name + Class */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 flex-wrap mb-2">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{user?.name || "Student"}</h1>
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border bg-linear-to-r shadow-sm ${level.bg} ${level.border} ${level.color}`}>
                <Crown className="h-3.5 w-3.5" />
                {level.title}
              </span>
            </div>
            <p className="text-slate-500 font-medium mb-5">{user?.email}</p>
 
            {/* XP Progress */}
            <div className="max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 flex items-center gap-1.5 uppercase tracking-widest leading-none">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                  <span className="text-slate-900">{points.toLocaleString()}</span> / {nextLevelXP.toLocaleString()} XP
                </span>
                <span className="text-[10px] font-extrabold text-primary-600 uppercase tracking-widest">Next level</span>
              </div>
              <div className="h-3.5 rounded-full bg-slate-100 border border-slate-200/50 shadow-inner overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-primary-600 to-indigo-600 transition-all duration-1000 ease-out shadow-[0_2px_10px_rgba(79,70,229,0.3)]"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          </div>
 
          {/* Action Buttons */}
          <div className="shrink-0 self-center flex flex-col gap-3">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="font-bold px-6 py-3 rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all w-full"
              leftIcon={<User className="h-5 w-5" />}
            >
              Edit Profile
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="secondary"
              className="font-bold px-6 py-3 rounded-2xl shadow-lg active:scale-95 transition-all w-full"
              leftIcon={linkCopied ? <CheckCircle className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            >
              {linkCopied ? "Copied!" : "Public Profile"}
            </Button>
          </div>
        </div>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
 
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Zap}
          label="Total XP"
          value={points}
          color="bg-amber-50 text-amber-600 border-amber-100"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={streak}
          color="bg-orange-50 text-orange-600 border-orange-100"
        />
        <StatCard
          icon={Trophy}
          label="Best Streak"
          value={maxStreak}
          color="bg-red-50 text-red-600 border-red-100"
        />
        <StatCard
          icon={Award}
          label="Badges"
          value={earnedBadges.length}
          color="bg-purple-50 text-purple-600 border-purple-100"
        />
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={enrollments?.length || 0}
          color="bg-sky-50 text-sky-600 border-sky-100"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completedCount}
          color="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Badge Collection */}
          <Card 
            className="bg-white border-slate-200 shadow-xl"
            header={
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                  <Sparkles className="h-6 w-6 text-purple-600 drop-shadow-sm" />
                  Achievement Gallery
                </h3>
                <Badge variant="primary" className="font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                  {earnedBadges.length} / {badges.length} Unlocked
                </Badge>
              </div>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-2xl border p-4 text-center transition-all duration-500 relative group/badge ${
                    badge.earned
                      ? `${rarityBg[badge.rarity]} ${rarityBorder[badge.rarity]} hover:shadow-xl hover:-translate-y-1 cursor-pointer`
                      : "border-slate-100 bg-slate-50/50 opacity-40 grayscale"
                  }`}
                >
                  {badge.earned && badge.rarity === "legendary" && (
                     <div className="absolute -top-1.5 -right-1.5">
                       <Zap className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
                     </div>
                  )}
                  <div className="text-3xl mb-2 filter drop-shadow-md group-hover/badge:scale-110 transition-transform">{badge.icon}</div>
                  <p className="text-xs font-extrabold text-slate-900 truncate uppercase tracking-wider">{badge.name}</p>
                  <p className="text-[10px] font-medium text-slate-500 line-clamp-1 mt-1">{badge.description}</p>
                  {badge.earned && (
                    <span className={`inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-white ${
                      badge.rarity === "legendary" ? "text-amber-700 border-amber-200" :
                      badge.rarity === "epic" ? "text-purple-700 border-purple-200" :
                      badge.rarity === "rare" ? "text-sky-700 border-sky-200" : "text-slate-500 border-slate-200"
                    }`}>
                      {badge.rarity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
 
          {/* Activity Heatmap */}
          <Card 
            className="bg-white border-slate-200 shadow-xl"
            header={
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <Flame className="h-6 w-6 text-orange-600 fill-orange-500/20" />
                Evolution Matrix
              </h3>
            }
          >
            <div className="p-2 overflow-x-auto">
              <ActivityHeatmap data={user?.activityLog || []} />
            </div>
          </Card>
 
          {/* Personal Info */}
          <Card 
            className="bg-white border-slate-200 shadow-xl"
            header={<h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Profile Details</h3>}
          >
            {infoItems.length === 0 ? (
              <EmptyState title="No details shared" description="Your profile information will appear here." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {infoItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-slate-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
                  >
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 shadow-inner shrink-0">
                      <item.icon className="h-6 w-6 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5 leading-none">{item.label}</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{String(item.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
 
        {/* Right Column */}
        <div className="space-y-8">
          {/* Skill Radar */}
          <SkillRadar />
 
          {/* Certificates */}
          <Card 
            className="bg-white border-slate-200 shadow-xl overflow-hidden"
            header={
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <Award className="h-6 w-6 text-emerald-600 drop-shadow-sm" />
                Official Credentials
              </h3>
            }
          >
            {certsLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="md" />
              </div>
            ) : !certificates?.length ? (
              <div className="py-6 text-center">
                <Award className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400 px-4">
                  Complete your courses to unlock professional certifications!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert) => {
                  const courseTitle =
                    typeof cert.course === "object" ? cert.course.title : "Course";
                  const courseId =
                    typeof cert.course === "object" ? cert.course._id : cert.course;
                  return (
                    <Link
                      key={cert._id}
                      to={`/certificates/${courseId}`}
                      className="group/cert flex items-center gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-4 transition-all hover:bg-white hover:border-emerald-300 hover:shadow-emerald-500/10 hover:shadow-lg"
                    >
                      <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-sm group-hover/cert:bg-emerald-50 group-hover/cert:border-emerald-200 transition-colors">
                        <Award className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-slate-900 group-hover/cert:text-emerald-700 transition-colors">{cert.title}</p>
                        <p className="text-[11px] font-black text-slate-500 mt-0.5 leading-none">
                          {courseTitle} <span className="mx-1.5 opacity-50">•</span> {formatDate(cert.issuedAt)}
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
