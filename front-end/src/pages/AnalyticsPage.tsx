import { useState } from "react";
import { Download, Users, TrendingUp, Award, Target } from "lucide-react";
import { Button, Card, Badge, Tabs, Spinner } from "@/components/ui";
import { dashboardService } from "@/services";
import { useApi } from "@/hooks/useApi";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "leaderboard", label: "Leaderboard" },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats, loading: statsLoading } = useApi(() => dashboardService.getStats(), []);
  const { data: userGrowth, loading: growthLoading } = useApi(() => dashboardService.getUserGrowth(), []);
  const { data: testPerformance, loading: perfLoading } = useApi(() => dashboardService.getTestPerformance(), []);
  const { data: leaderboardData, loading: leaderLoading } = useApi(() => dashboardService.getLeaderboard({ limit: 20 }), []);
  const leaderboard = (leaderboardData as any)?.leaderboard || leaderboardData || [];

  const isLoading = statsLoading || growthLoading || perfLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>Export CSV</Button>
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />}>Export PDF</Button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-100 rounded-xl">
                      <Users className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
                      <p className="text-sm text-gray-500">Total Users</p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-secondary-100 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-secondary-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats?.avgPoints ?? 0}</p>
                      <p className="text-sm text-gray-500">Avg Points</p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <Target className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalTests ?? 0}</p>
                      <p className="text-sm text-gray-500">Total Tests</p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalCertificates ?? 0}</p>
                      <p className="text-sm text-gray-500">Certificates</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card header={<h3 className="text-base font-semibold text-gray-900">User Growth Trend</h3>}>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userGrowth || []}>
                        <defs>
                          <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                        <Area type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2.5} fill="url(#colorGrowth)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card header={<h3 className="text-base font-semibold text-gray-900">Test Performance</h3>}>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={testPerformance || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                        <Legend />
                        <Bar dataKey="avgScore" name="Avg Score" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="passRate" name="Pass Rate %" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "leaderboard" && (
        <Card header={
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Platform Leaderboard</h3>
            <Badge variant="primary">{Array.isArray(leaderboard) ? leaderboard.length : 0} Students</Badge>
          </div>
        } noPadding>
          {leaderLoading ? (
            <div className="flex items-center justify-center h-40">
              <Spinner />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-surface-border">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Streak</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Max Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {(Array.isArray(leaderboard) ? leaderboard : []).map((entry: any, index: number) => {
                  const rank = index + 1;
                  const name = entry.student?.name || entry.name || "Unknown";
                  return (
                    <tr key={entry._id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          rank === 1 ? "bg-secondary-100 text-secondary-700" :
                          rank === 2 ? "bg-gray-200 text-gray-700" :
                          rank === 3 ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {rank}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-primary-600">{entry.points} pts</span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{entry.streak} days</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <Badge variant="gray">{entry.maxStreak} days</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
