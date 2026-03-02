import { useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { PATHS } from "@/config/routes";

const pageTitles: Record<string, string> = {
  [PATHS.DASHBOARD]: "Dashboard",
  [PATHS.USERS]: "User Management",
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
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 rounded-lg bg-surface-secondary border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
        </button>

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
