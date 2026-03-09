import { UserPlus, BookPlus, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

export function QuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const actions = [
    // {
    //   label: isAdmin ? "Add Student" : "Add User",
    //   icon: <UserPlus className="h-5 w-5" />,
    //   onClick: () => navigate("/users"),
    //   variant: "primary" as const,
    // },
    ...(!isAdmin ? [
      {
        label: "Add Course",
        icon: <BookPlus className="h-5 w-5" />,
        onClick: () => navigate("/courses"),
        variant: "secondary" as const,
      },
      {
        label: "Generate Report",
        icon: <FileDown className="h-5 w-5" />,
        onClick: () => navigate("/analytics"),
        variant: "outline" as const,
      },
    ] : []),
  ];

  return (
    <div className="bg-surface rounded-xl shadow-card border border-surface-border p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            leftIcon={action.icon}
            onClick={action.onClick}
            className="w-full justify-start"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
