import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Users,
  Building2,
  Gift,
  Swords,
  Crown,
  Star,
  Calendar,
  Clock,
  ChevronRight,
  Zap,
  Medal,
  Loader2,
} from "lucide-react";
import { Card, Badge, Spinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { contestService } from "@/services";
import type { Contest } from "@/services/contest.service";
import toast from "react-hot-toast";

function ContestCard({
  contest,
  onRegister,
  registering,
}: {
  contest: Contest;
  onRegister: (id: string) => void;
  registering: string | null;
}) {
  const navigate = useNavigate();
  const isLive = contest.status === "LIVE";
  const isEnded = contest.status === "ENDED";
  const startDate = new Date(contest.startTime);

  const difficultyColor = {
    Easy: "success" as const,
    Medium: "warning" as const,
    Hard: "danger" as const,
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden group ${
        isLive
          ? "border-red-200 bg-linear-to-br from-red-50 to-orange-50 shadow-sm"
          : isEnded
          ? "border-slate-100 bg-slate-50 opacity-70"
          : "border-slate-200 bg-white hover:border-primary-300 shadow-sm"
      }`}
    >
      {/* Live pulse */}
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
            Live Now
          </span>
        </div>
      )}

      {/* Sponsor badge */}
      {contest.sponsor && (
        <div className="flex items-center gap-1.5 mb-3">
          <Building2 className="h-3.5 w-3.5 text-purple-600" />
          <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
            Sponsored by {contest.sponsor}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-base font-semibold text-slate-900">{contest.title}</h3>
            <Badge variant={difficultyColor[contest.difficulty]}>
              {contest.difficulty}
            </Badge>
          </div>
          {contest.description && (
            <p className="text-sm text-slate-500 mb-3">{contest.description}</p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {isEnded
                ? `Ended ${startDate.toLocaleDateString()}`
                : startDate.toLocaleDateString() +
                  " " +
                  startDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {contest.duration} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {contest.participants}
              {contest.maxParticipants
                ? `/${contest.maxParticipants}`
                : ""}{" "}
              joined
            </span>
            {contest.questions && (
              <span className="flex items-center gap-1">
                <Swords className="h-3.5 w-3.5" />
                {Array.isArray(contest.questions)
                  ? contest.questions.length
                  : 0}{" "}
                problems
              </span>
            )}
          </div>

          {/* Rewards */}
          {contest.rewards?.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Gift className="h-3.5 w-3.5 text-amber-600" />
              {contest.rewards.map((reward, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100"
                >
                  {reward}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0">
          {isLive ? (
            contest.isRegistered ? (
              <button 
                onClick={() => navigate(`/contests/${contest._id}/battle`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer"
              >
                <Swords className="h-4 w-4" />
                Enter Battle
              </button>
            ) : (
              <button
                onClick={() => onRegister(contest._id)}
                disabled={registering === contest._id}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {registering === contest._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Swords className="h-4 w-4" />
                )}
                Join & Enter
              </button>
            )
          ) : isEnded ? (
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium cursor-pointer hover:bg-white shadow-sm transition-all">
              View Results
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : contest.isRegistered ? (
            <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium">
              ✓ Registered
            </span>
          ) : (
            <button
              onClick={() => onRegister(contest._id)}
              disabled={registering === contest._id}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl mc-btn-gradient text-sm font-medium cursor-pointer disabled:opacity-50"
            >
              {registering === contest._id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Register
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContestArenaPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "live" | "upcoming" | "past">("all");
  const [registering, setRegistering] = useState<string | null>(null);

  const fetchContests = useCallback(
    () =>
      contestService.getContests({
        status: tab === "all" ? undefined : tab === "past" ? "ended" : tab,
      }),
    [tab]
  );

  const { data, loading, refetch } = useApi(fetchContests, [tab]);
  const contests: Contest[] = data?.contests ?? [];

  const liveCount = contests.filter((c) => c.status === "LIVE").length;

  const handleRegister = async (contestId: string) => {
    setRegistering(contestId);
    try {
      await contestService.register(contestId);
      toast.success("Successfully registered for the contest!");
      refetch();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to register for contest";
      toast.error(message);
    } finally {
      setRegistering(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl p-8 group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-50 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-50 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100 shadow-inner">
              <Trophy className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">The Contest Arena</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Compete in legendary code battles, earn massive XP, and dominate the rankings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 self-start md:self-center">
            <div className="text-right border-r border-slate-200 pr-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Standing</p>
              <p className="text-2xl font-black text-amber-600 flex items-center gap-1.5 justify-end">
                <Crown className="h-5 w-5" /> —
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Battle Points</p>
              <p className="text-2xl font-black text-primary-600 flex items-center gap-1.5 justify-end">
                <Zap className="h-5 w-5" /> {user?.points || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl w-fit shadow-inner relative z-10">
        {(["all", "live", "upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer uppercase tracking-widest flex items-center gap-2.5 ${
              tab === t
                ? "bg-white text-primary-600 shadow-lg shadow-primary-500/10 border border-slate-100"
                : "text-slate-400 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            {t === "live" && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
            {t === "all" ? "All Contests" : t}
            {t === "live" && `(${liveCount})`}
          </button>
        ))}
      </div>

      {/* Contest List */}
      {loading ? (
        <div className="flex justify-center items-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contests.length === 0 ? (
            <Card className="bg-white border-slate-200 shadow-xl py-20 text-center">
              <Trophy className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-extrabold text-slate-900">Arena is Quiet...</p>
              <p className="text-sm font-medium text-slate-500 mt-1 max-w-xs mx-auto">
                No active battles found in this sector. Sharpen your skills and prepare for deployment!
              </p>
            </Card>
          ) : (
            contests.map((contest) => (
              <ContestCard
                key={contest._id}
                contest={contest}
                onRegister={handleRegister}
                registering={registering}
              />
            ))
          )}
        </div>
      )}

      {/* Leaderboard Preview */}
      {contests.length > 0 && (
        <Card
          className="bg-white border-slate-200 shadow-xl overflow-hidden"
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <Medal className="h-6 w-6 text-amber-500 drop-shadow-sm" />
                Global Battleground Leaderboard
              </h3>
              <Badge variant="primary" className="font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                Top Performers
              </Badge>
            </div>
          }
        >
          <div className="text-center py-12 px-6">
            <div className="relative inline-block mb-4">
               <Star className="h-12 w-12 text-slate-100 scale-150 rotate-12" />
               <Star className="h-8 w-8 text-slate-200 absolute inset-0 m-auto" />
            </div>
            <p className="text-sm font-bold text-slate-400 max-w-sm mx-auto">
              Deployment in progress. Complete an arena challenge to benchmark your performance against the community!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
