import { useLocation } from "react-router-dom";
import { PATHS } from "@/config/routes";

const pageTitles: Record<string, string> = {
  [PATHS.DASHBOARD]: "Dashboard — Game HQ",
  [PATHS.COURSES]: "My Courses",
  [PATHS.TESTS]: "Tests",
  [PATHS.LEADERBOARD]: "Leaderboard",
  [PATHS.ACTIVITY]: "Activity",
  [PATHS.PROFILE]: "Hero Profile — Your Legend",
  [PATHS.QUESTS]: "Problem Set — Quest Map",
  [PATHS.CONTESTS]: "Contest Arena — Live Battles",
  [PATHS.MOCK_INTERVIEWS]: "Mock Interview — Boss Battle Mode",
};

export function Header() {
  const location = useLocation();

  const pageTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/courses/") ? "Course Details" :
     location.pathname.startsWith("/arena/") ? "Code Arena — Battle Mode" : "Dashboard");

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{pageTitle}</h2>
        {location.pathname === PATHS.DASHBOARD ? (
          <p className="text-sm text-slate-500 mt-1">
            Personalised, gamified home base. Daily quests, XP progress, streak, and AI nudges — all visible at a glance.
          </p>
        ) : location.pathname === PATHS.QUESTS ? (
          <p className="text-sm text-slate-500 mt-1">
            Problems are quests on a visual map. AI recommends your next quest based on skill gaps and goals.
          </p>
        ) : location.pathname === PATHS.CONTESTS ? (
          <p className="text-sm text-slate-500 mt-1">
            Weekly rated contests, company-sponsored tournaments, and team hackathons with real prizes.
          </p>
        ) : location.pathname === PATHS.MOCK_INTERVIEWS ? (
          <p className="text-sm text-slate-500 mt-1">
            Simulate real technical interviews. AI plays a company-specific interviewer and gives hiring-level feedback.
          </p>
        ) : location.pathname === PATHS.PROFILE ? (
          <p className="text-sm text-slate-500 mt-1">
            Public profile as a rich developer identity — level, badges, skills, streak, and recruiter-shareable card.
          </p>
        ) : location.pathname.startsWith("/arena/") ? (
          <p className="text-sm text-slate-500 mt-1">
            Distraction-free split-panel IDE. Runs in browser. Shows complexity, hints, and reward on completion.
          </p>
        ) : (
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </header>
  );
}
