import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileQuestion,
  BarChart3,
  Award,
  Settings,
  LogOut,
  ShieldCheck,
  UserRound,
  ChevronDown,
  Trophy,
  Briefcase,
} from "lucide-react";
import { PATHS } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";
import logo from "../../assets/logo.jpeg"

interface NavChild {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
}

const superAdminNavItems: NavItem[] = [
  { path: PATHS.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  {
    path: PATHS.USERS,
    label: "Users",
    icon: Users,
    children: [
      { path: `${PATHS.USERS}?role=ADMIN`, label: "Admins", icon: ShieldCheck },
      { path: `${PATHS.USERS}?role=STUDENT`, label: "Students", icon: UserRound },
    ],
  },
  { path: PATHS.COURSES, label: "Courses", icon: BookOpen },
  { path: PATHS.TESTS, label: "Questions", icon: FileQuestion },
  { path: PATHS.CONTESTS, label: "Contests", icon: Trophy },
  { path: PATHS.INTERVIEWS, label: "Interviews", icon: Briefcase },
  { path: PATHS.ANALYTICS, label: "Analytics", icon: BarChart3 },
  { path: PATHS.CERTIFICATES, label: "Certificates", icon: Award },
  { path: PATHS.SYSTEM, label: "System", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { path: PATHS.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { path: PATHS.USERS, label: "Students", icon: UserRound },
  { path: PATHS.COURSES, label: "Courses", icon: BookOpen },
  // { path: PATHS.TESTS, label: "Tests", icon: FileQuestion },
  { path: PATHS.CERTIFICATES, label: "Certificates", icon: Award },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? adminNavItems : superAdminNavItems;
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand parent if we're on a child route
    return navItems
      .filter((item) => item.children && location.pathname.startsWith(item.path))
      .map((item) => item.path);
  });

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-40">
      {/* Brand */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="h-14 w-14 bg-black rounded-xl flex items-center p-1 justify-center overflow-hidden">
          <img src={logo} alt="Logo" className="h-full w-full text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">Skill & Brains</h1>
          <p className="text-sidebar-text text-xs">{isAdmin ? "Organisation Admin" : "Super Admin"}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path && !location.search;
          const isExpanded = expandedItems.includes(item.path);
          const hasChildren = item.children && item.children.length > 0;
          const isChildActive = hasChildren && location.pathname === item.path && !!location.search;
          const isParentActive = isActive || isChildActive;

          return (
            <div key={item.path}>
              <div className="flex items-center">
                <NavLink
                  to={item.path}
                  onClick={hasChildren ? (e) => { e.preventDefault(); toggleExpand(item.path); } : undefined}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex-1",
                    isParentActive
                      ? "bg-sidebar-active text-sidebar-text-active shadow-lg shadow-primary-900/20"
                      : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                  )}
                >
                  {isParentActive && (
                    <div className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full" />
                  )}
                  <item.icon className={clsx("h-5 w-5", isParentActive && "text-primary-400")} />
                  <span className="flex-1">{item.label}</span>
                  {hasChildren && (
                    <ChevronDown className={clsx("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                  )}
                </NavLink>
              </div>
              {hasChildren && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children!.map((child) => {
                    const childActive = `${location.pathname}${location.search}` === child.path;
                    return (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          childActive
                            ? "bg-sidebar-active text-sidebar-text-active"
                            : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                        )}
                      >
                        <child.icon className={clsx("h-4 w-4", childActive && "text-primary-400")} />
                        {child.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
