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
          ? "border-red-500/40 bg-linear-to-br from-red-500/5 to-orange-500/5 shadow-[0_0_30px_rgba(239,68,68,0.06)]"
          : isEnded
          ? "border-slate-700/60 bg-slate-900/40 opacity-70"
          : "border-slate-800/80 bg-slate-900/60 hover:border-primary-500/40"
      }`}
    >
      {/* Live pulse */}
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
            Live Now
          </span>
        </div>
      )}

      {/* Sponsor badge */}
      {contest.sponsor && (
        <div className="flex items-center gap-1.5 mb-3">
          <Building2 className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs font-medium text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/20">
            Sponsored by {contest.sponsor}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-base font-semibold text-white">{contest.title}</h3>
            <Badge variant={difficultyColor[contest.difficulty]}>
              {contest.difficulty}
            </Badge>
          </div>
          {contest.description && (
            <p className="text-sm text-slate-400 mb-3">{contest.description}</p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
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
              <Gift className="h-3.5 w-3.5 text-amber-400" />
              {contest.rewards.map((reward, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/15"
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
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors cursor-pointer"
              >
                <Swords className="h-4 w-4" />
                Enter Battle
              </button>
            ) : (
              <button
                onClick={() => onRegister(contest._id)}
                disabled={registering === contest._id}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
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
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-400 text-sm font-medium cursor-pointer">
              View Results
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : contest.isRegistered ? (
            <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mc-glass p-6">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/30">
              <Trophy className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Contest Arena</h1>
              <p className="text-sm text-slate-400">
                Compete in live battles, win rewards, and climb the ranks
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">Your Rank</p>
              <p className="text-lg font-bold text-amber-300 flex items-center gap-1">
                <Crown className="h-4 w-4" /> —
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Total XP</p>
              <p className="text-lg font-bold text-primary-300 flex items-center gap-1">
                <Zap className="h-4 w-4" /> {user?.points || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl w-fit border border-slate-700/60">
        {(["all", "live", "upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              tab === t
                ? "bg-primary-500/30 text-white border border-primary-500/50 shadow-lg shadow-primary-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            {t === "all" && "All Contests"}
            {t === "live" && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                Live ({liveCount})
              </>
            )}
            {t === "upcoming" && "Upcoming"}
            {t === "past" && "Past"}
          </button>
        ))}
      </div>

      {/* Contest List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {contests.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No contests in this category</p>
              <p className="text-xs text-slate-500 mt-1">
                Check back later for new contests!
              </p>
            </div>
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

      {/* Leaderboard preview — only if contests exist */}
      {contests.length > 0 && (
        <Card
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Medal className="h-5 w-5 text-amber-400" />
                Contest Leaderboard
              </h3>
              <span className="text-xs text-slate-400">
                Top performers across all contests
              </span>
            </div>
          }
        >
          <div className="text-center py-6 text-slate-400 text-sm">
            <Star className="h-8 w-8 mx-auto mb-2 text-slate-600" />
            <p>Complete a contest to appear on the leaderboard!</p>
          </div>
        </Card>
      )}
    </div>
  );
}
