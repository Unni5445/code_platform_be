import { useCallback } from "react";
import { Trophy, Medal, Flame, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { dashboardService } from "@/services";
import type { LeaderboardEntry } from "@/services/dashboard.service";
import { Card, Spinner, Avatar, Badge, EmptyState } from "@/components/ui";
import clsx from "clsx";

export default function LeaderboardPage() {
  const { user } = useAuth();

  const fetchLeaderboard = useCallback(
    () => dashboardService.getLeaderboard({ limit: 50 }),
    []
  );
  const { data, loading } = useApi<{ leaderboard: LeaderboardEntry[]; total: number }>(
    fetchLeaderboard,
    []
  );

  const leaderboard = data?.leaderboard || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track XP, streaks, and see where you stand among other coders.
        </p>
      </div>

      {/* Top 3 – spotlight */}
      {leaderboard.length >= 3 && (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 0, 2].map((rank) => {
            const entry = leaderboard[rank];
            if (!entry) return null;
            const isCurrentUser = entry.student._id === user?._id;
            const colors = [
              "from-yellow-300 to-amber-500",
              "from-slate-200 to-slate-500",
              "from-orange-300 to-orange-500",
            ];
            const medals = ["text-yellow-900", "text-slate-900", "text-orange-900"];

            return (
              <Card
                key={entry._id}
                className={clsx(
                  "mc-glass-soft text-center",
                  rank === 0 && "md:-translate-y-2",
                  isCurrentUser && "ring-2 ring-primary-500/80"
                )}
              >
                <div
                  className={clsx(
                    "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br",
                    colors[rank]
                  )}
                >
                  <Medal className={clsx("h-6 w-6", medals[rank])} />
                </div>
                <Avatar name={entry.student.name} size="lg" className="mx-auto mb-2" />
                <h3 className="font-semibold text-slate-50">{entry.student.name}</h3>
                <p className="mb-3 text-xs text-slate-400">{entry.student.email}</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Star className="h-4 w-4" /> {entry.points} XP
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Flame className="h-4 w-4" /> {entry.streak} day streak
                  </span>
                </div>
                <Badge variant={rank === 0 ? "warning" : "gray"} className="mt-3">
                  #{rank + 1}
                </Badge>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <Card noPadding className="mc-glass-soft mc-gradient-border overflow-hidden">
        {leaderboard.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-10 w-10 text-primary-400" />}
            title="No Rankings Yet"
            description="Leaderboard rankings will appear once students start earning points."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/60 text-xs uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-6 py-3 text-left">Rank</th>
                  <th className="px-6 py-3 text-left">Student</th>
                  <th className="px-6 py-3 text-left">XP</th>
                  <th className="px-6 py-3 text-left">Streak</th>
                  <th className="px-6 py-3 text-left">Max Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.student._id === user?._id;
                  return (
                    <tr
                      key={entry._id}
                      className={clsx(
                        "mc-table-row transition-colors",
                        isCurrentUser
                          ? "bg-primary-500/10"
                          : "hover:bg-slate-900/60"
                      )}
                    >
                      <td className="px-6 py-4">
                        <span
                          className={clsx(
                            "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                            index === 0
                              ? "bg-yellow-400/20 text-yellow-300"
                              : index === 1
                              ? "bg-slate-400/20 text-slate-200"
                              : index === 2
                              ? "bg-orange-400/20 text-orange-300"
                              : "bg-slate-800/70 text-slate-300"
                          )}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={entry.student.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-slate-50">
                              {entry.student.name}
                              {isCurrentUser && (
                                <span className="ml-1 text-primary-300">(You)</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{entry.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm font-semibold text-amber-300">
                          <Star className="h-4 w-4 text-amber-300" /> {entry.points}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm text-emerald-300">
                          <Flame className="h-4 w-4 text-emerald-300" /> {entry.streak}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{entry.maxStreak}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
