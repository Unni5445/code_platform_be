import { Card, Spinner } from "@/components/ui";
import { dashboardService } from "@/services";
import { useApi } from "@/hooks/useApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function TestPerformanceChart() {
  const { data, loading } = useApi(
    () => dashboardService.getTestPerformance(),
    []
  );

  return (
    <Card header={<h3 className="text-base font-semibold text-gray-900">Test Performance</h3>}>
      <div className="h-72">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
              <Bar dataKey="avgScore" name="Avg Score" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              <Bar dataKey="passRate" name="Pass Rate %" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
