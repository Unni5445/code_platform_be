import { useLocation } from "react-router-dom";
import { PATHS } from "@/config/routes";

const pageTitles: Record<string, string> = {
  [PATHS.DASHBOARD]: "Dashboard",
  [PATHS.COURSES]: "My Courses",
  [PATHS.TESTS]: "Tests",
  [PATHS.LEADERBOARD]: "Leaderboard",
  [PATHS.ACTIVITY]: "Activity",
  [PATHS.PROFILE]: "Profile",
  [PATHS.PLAYGROUND]: "Playground",
};

export function Header() {
  const location = useLocation();

  const pageTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/courses/") ? "Course Details" :
     location.pathname.startsWith("/playground/") ? "Practice" : "Dashboard");

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{pageTitle}</h2>
        <p className="text-sm text-slate-400 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </header>
  );
}
