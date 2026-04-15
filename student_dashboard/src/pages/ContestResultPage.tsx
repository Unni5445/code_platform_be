import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Medal, Clock, ArrowLeft, Star, Timer, Users } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { contestService } from "@/services";
import type { Contest, ContestLeaderboardEntry } from "@/services/contest.service";
import { Card, Spinner, Avatar, Badge, Button } from "@/components/ui";
import clsx from "clsx";

export default function ContestResultPage() {
  const { id: contestId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const fetchContest = useCallback(() => contestService.getContestById(contestId!), [contestId]);
  const { data: contestData, loading: contestLoading } = useApi<Contest>(fetchContest, [contestId]);

  const fetchLeaderboard = useCallback(() => contestService.getLeaderboard(contestId!), [contestId]);
  const { data: leaderboardData, loading: leaderboardLoading } = useApi<{ leaderboard: ContestLeaderboardEntry[] }>(
    fetchLeaderboard,
    [contestId]
  );

  const contest = contestData;
  const leaderboard = leaderboardData?.leaderboard || [];

  const formatTime = (seconds?: number) => {
    if (seconds == null) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (contestLoading || leaderboardLoading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-bold">Contest not found.</p>
        <Button onClick={() => navigate("/contests")} className="mt-4">
          Back to Arena
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate("/contests")}
            className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Arena
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{contest.title} Results</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {contest.duration} Minutes</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {leaderboard.length} Participants</span>
            </p>
          </div>
        </div>
        <Badge variant="danger" className="font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-red-500/10">
          CONTEST ENDED
        </Badge>
      </div>

      {/* Top 3 Spotlight */}
      {leaderboard.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3 items-end pt-4">
          {[1, 0, 2].map((rankIdx) => {
            const entry = leaderboard[rankIdx];
            if (!entry) return <div key={rankIdx} className="hidden md:block" />;
            
            const colors = [
              "from-amber-100 to-amber-200 border-amber-200 shadow-amber-500/10",
              "from-slate-50 to-slate-100 border-slate-200 shadow-slate-500/10",
              "from-orange-50 to-orange-100 border-orange-200 shadow-orange-500/10",
            ];
            const medals = ["text-amber-600", "text-slate-400", "text-orange-600"];
            const rankLabel = ["1st", "2nd", "3rd"];

            return (
              <Card
                key={entry.student._id}
                className={clsx(
                  "relative bg-white border-slate-200 text-center transition-all duration-300 hover:shadow-2xl overflow-hidden",
                  rankIdx === 0 ? "md:scale-110 md:-translate-y-4 shadow-2xl z-10" : "shadow-xl opacity-90"
                )}
              >
                <div className={clsx("absolute top-0 left-0 right-0 h-1 bg-linear-to-r", 
                  rankIdx === 0 ? "from-amber-400 via-yellow-300 to-amber-400" : 
                  rankIdx === 1 ? "from-slate-300 to-slate-400" : 
                  "from-orange-400 to-orange-500")} 
                />
                <div
                  className={clsx(
                    "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-b-4 bg-linear-to-br shadow-inner mt-2",
                    colors[rankIdx]
                  )}
                >
                  <Medal className={clsx("h-7 w-7", medals[rankIdx])} />
                </div>
                <Avatar name={entry.student.name} size="lg" className="mx-auto mb-4 border-4 border-white shadow-lg" />
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{entry.student.name}</h3>
                <p className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{rankLabel[rankIdx]} Position</p>
                
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Score</span>
                    <span className="flex items-center justify-center gap-1 text-sm font-extrabold text-amber-600">
                      <Trophy className="h-4 w-4" /> {entry.score}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Time</span>
                    <span className="flex items-center justify-center gap-1 text-sm font-extrabold text-primary-600">
                      <Timer className="h-4 w-4" /> {formatTime(entry.timeTaken)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Rankings Table */}
      <Card noPadding className="bg-white border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-8 py-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Final Battle Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-8 py-5 text-left">Rank</th>
                <th className="px-8 py-5 text-left">Participant</th>
                <th className="px-8 py-5 text-left">Accuracy</th>
                <th className="px-8 py-5 text-left">Completion Time</th>
                <th className="px-8 py-5 text-left">Final Battle Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {leaderboard.map((entry, index) => (
                <tr key={entry.student._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5">
                    <span className={clsx(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black shadow-sm border",
                      index === 0 ? "bg-amber-100 text-amber-700 border-amber-200" :
                      index === 1 ? "bg-slate-100 text-slate-600 border-slate-200" :
                      index === 2 ? "bg-orange-100 text-orange-700 border-orange-200" :
                      "bg-white text-slate-400 border-slate-100"
                    )}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={entry.student.name} size="sm" />
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 leading-none mb-1">{entry.student.name}</p>
                        {/* Email hidden for privacy */}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500">
                    {entry.solvedCount} / {entry.totalQuestions} Questions
                  </td>
                  <td className="px-8 py-5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <Timer className="h-3.5 w-3.5 text-slate-400" /> {formatTime(entry.timeTaken)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="flex items-center gap-1.5 text-sm font-black text-amber-600">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {entry.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
