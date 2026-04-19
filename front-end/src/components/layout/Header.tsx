import { useLocation } from "react-router-dom";
import { Avatar } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { PATHS } from "@/config/routes";

const pageTitles: Record<string, string> = {
  [PATHS.DASHBOARD]: "Dashboard",
  [PATHS.ADMINS]: "Admin Management",
  [PATHS.STUDENTS]: "Student Management",
  [PATHS.COURSES]: "Courses & Modules",
  [PATHS.TESTS]: "Tests & Question Bank",
  [PATHS.ANALYTICS]: "Analytics & Reports",
  [PATHS.CERTIFICATES]: "Certificates",
  [PATHS.SYSTEM]: "System Management",
};

export function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface border-b border-surface-border flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{pageTitle}</h2>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-surface-border">
          <Avatar name={user?.name || "Admin"} size="sm" />
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-gray-900">{user?.name || "Super Admin"}</p>
            <p className="text-xs text-gray-500">{user?.email || "admin@platform.com"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
