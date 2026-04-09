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
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Leaderboard</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Track your progress, maintain your streak, and compete with the best coders in the community.
        </p>
      </div>
 
      {/* Top 3 – spotlight */}
      {leaderboard.length >= 3 && (
        <div className="grid gap-6 md:grid-cols-3 items-end">
          {[1, 0, 2].map((rank) => {
            const entry = leaderboard[rank];
            if (!entry) return null;
            const isCurrentUser = entry.student._id === user?._id;
            const colors = [
              "from-amber-100 to-amber-200 border-amber-200 shadow-amber-500/10",
              "from-slate-50 to-slate-100 border-slate-200 shadow-slate-500/10",
              "from-orange-50 to-orange-100 border-orange-200 shadow-orange-500/10",
            ];
            const medals = ["text-amber-600", "text-slate-400", "text-orange-600"];
            const rankLabel = ["1st", "2nd", "3rd"];
 
            return (
              <Card
                key={entry._id}
                className={clsx(
                  "relative bg-white border-slate-200 text-center transition-all duration-300 hover:shadow-2xl overflow-hidden",
                  rank === 0 ? "md:scale-110 md:-translate-y-4 shadow-2xl z-10" : "shadow-xl opacity-90",
                  isCurrentUser && "ring-2 ring-primary-500 ring-offset-4 ring-offset-slate-50"
                )}
              >
                <div className={clsx("absolute top-0 left-0 right-0 h-1 bg-linear-to-r", 
                  rank === 0 ? "from-amber-400 via-yellow-300 to-amber-400" : 
                  rank === 1 ? "from-slate-300 to-slate-400" : 
                  "from-orange-400 to-orange-500")} 
                />
                <div
                  className={clsx(
                    "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-b-4 bg-linear-to-br shadow-inner mt-2",
                    colors[rank]
                  )}
                >
                  <Medal className={clsx("h-7 w-7", medals[rank])} />
                </div>
                <Avatar name={entry.student.name} size="lg" className="mx-auto mb-4 border-4 border-white shadow-lg" />
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{entry.student.name}</h3>
                <p className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{rankLabel[rank]} Position</p>
                
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Points</span>
                    <span className="flex items-center justify-center gap-1 text-sm font-extrabold text-amber-600">
                      <Star className="h-4 w-4 fill-amber-500" /> {entry.points.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Streak</span>
                    <span className="flex items-center justify-center gap-1 text-sm font-extrabold text-emerald-600">
                      <Flame className="h-4 w-4 fill-emerald-500" /> {entry.streak}d
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
 
      {/* Full Leaderboard Table */}
      <Card noPadding className="bg-white border-slate-200 shadow-xl overflow-hidden">
        {leaderboard.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-12 w-12 text-slate-300" />}
            title="Leaderboard is Empty"
            description="Start solving challenges to earn points and climb the rankings!"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-extrabold tracking-[0.2em] text-slate-500 border-b border-slate-100">
                  <th className="px-8 py-5 text-left">Position</th>
                  <th className="px-8 py-5 text-left">Student Profile</th>
                  <th className="px-8 py-5 text-left">Experience</th>
                  <th className="px-8 py-5 text-left">Active Streak</th>
                  <th className="px-8 py-5 text-left">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.student._id === user?._id;
                  return (
                    <tr
                      key={entry._id}
                      className={clsx(
                        "transition-all duration-200",
                        isCurrentUser
                          ? "bg-primary-50/50"
                          : "hover:bg-slate-50/80"
                      )}
                    >
                      <td className="px-8 py-5">
                        <span
                          className={clsx(
                            "inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold shadow-sm border",
                            index === 0
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : index === 1
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : index === 2
                              ? "bg-orange-100 text-orange-700 border-orange-200"
                              : "bg-white text-slate-400 border-slate-100"
                          )}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar name={entry.student.name} size="sm" className="shadow-sm" />
                          <div>
                            <p className="text-sm font-extrabold text-slate-900 leading-none mb-1">
                              {entry.student.name}
                              {isCurrentUser && (
                                <Badge variant="primary" className="ml-2 text-[10px] px-2 py-0">YOU</Badge>
                              )}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400">{entry.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="flex items-center gap-1.5 text-sm font-extrabold text-amber-600">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {entry.points.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="flex items-center gap-1.5 text-sm font-extrabold text-emerald-600">
                          <Flame className="h-4 w-4 fill-emerald-500 text-emerald-500" /> {entry.streak} Days
                        </span>
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-400 text-xs uppercase tracking-widest">{entry.maxStreak} Max</td>
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
