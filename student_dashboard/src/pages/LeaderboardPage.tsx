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
        <h1 className="text-xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-500 mt-1">See how you rank against other students</p>
      </div>

      {/* Top 3 */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 0, 2].map((rank) => {
            const entry = leaderboard[rank];
            if (!entry) return null;
            const isCurrentUser = entry.student._id === user?._id;
            const colors = [
              "from-yellow-400 to-amber-500",
              "from-gray-300 to-gray-400",
              "from-orange-300 to-orange-400",
            ];
            const medals = ["text-yellow-500", "text-gray-400", "text-orange-400"];

            return (
              <Card
                key={entry._id}
                className={clsx(
                  "text-center",
                  rank === 0 && "transform -translate-y-2",
                  isCurrentUser && "ring-2 ring-primary-500"
                )}
              >
                <div className={clsx("w-12 h-12 rounded-full mx-auto mb-2 bg-gradient-to-br flex items-center justify-center", colors[rank])}>
                  <Medal className={clsx("h-6 w-6", medals[rank])} />
                </div>
                <Avatar name={entry.student.name} size="lg" className="mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">{entry.student.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{entry.student.email}</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-primary-600">
                    <Star className="h-4 w-4" /> {entry.points}
                  </span>
                  <span className="flex items-center gap-1 text-orange-500">
                    <Flame className="h-4 w-4" /> {entry.streak}
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
      <Card noPadding>
        {leaderboard.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-10 w-10 text-primary-400" />}
            title="No Rankings Yet"
            description="Leaderboard rankings will appear once students start earning points."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Points</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Streak</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Max Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.student._id === user?._id;
                  return (
                    <tr
                      key={entry._id}
                      className={clsx(
                        "transition-colors",
                        isCurrentUser ? "bg-primary-50" : "hover:bg-gray-50"
                      )}
                    >
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold",
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-100 text-gray-700" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-gray-50 text-gray-500"
                        )}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={entry.student.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {entry.student.name}
                              {isCurrentUser && <span className="text-primary-600 ml-1">(You)</span>}
                            </p>
                            <p className="text-xs text-gray-500">{entry.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                          <Star className="h-4 w-4 text-primary-500" /> {entry.points}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm text-gray-700">
                          <Flame className="h-4 w-4 text-orange-500" /> {entry.streak}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{entry.maxStreak}</td>
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
