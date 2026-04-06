import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  Zap,
  Filter,
  CheckCircle2,
  Flame,
  Swords,
  MapPin,
  Star,
  TrendingUp,
  Shield,
} from "lucide-react";
import { Badge, Spinner, EmptyState, Select } from "@/components/ui";
import { playgroundService } from "@/services";
import type { IQuestion } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

const DIFFICULTY_COLORS: Record<string, "success" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

const DIFFICULTY_XP_MULTIPLIER: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

function QuestCard({ q, onClick }: { q: IQuestion & { submissionCount?: number }; onClick: () => void }) {
  const xpMultiplier = DIFFICULTY_XP_MULTIPLIER[q.difficulty] || 1;
  const isHot = (q.submissionCount || 0) > 3;
  const isBonusXP = xpMultiplier >= 3;
  const isSolved = (q.submissionCount || 0) > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-5 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        isSolved
          ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/50"
          : isHot
          ? "border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:border-amber-400/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]"
          : "border-slate-800/80 bg-slate-900/60 hover:border-primary-500/40 hover:bg-slate-800/60"
      }`}
    >
      {/* Hot glow effect */}
      {isHot && !isSolved && (
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-colors" />
      )}

      {/* Bonus XP glow */}
      {isBonusXP && !isSolved && (
        <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/15 transition-colors" />
      )}

      <div className="flex items-start justify-between gap-4 relative">
        <div className="flex-1 min-w-0">
          {/* Quest badges row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {isHot && !isSolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/30 animate-pulse">
                <Flame className="h-3 w-3" /> Hot
              </span>
            )}
            {isBonusXP && !isSolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500/25 to-violet-500/25 text-purple-300 border border-purple-500/30">
                <Star className="h-3 w-3" /> Bonus XP
              </span>
            )}
            {isSolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" /> Conquered
              </span>
            )}
          </div>

          {/* Title + Difficulty */}
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className={`text-base font-semibold truncate transition-colors ${
              isSolved ? "text-emerald-200 group-hover:text-emerald-100" : "text-white group-hover:text-primary-300"
            }`}>
              {q.title}
            </h3>
            <Badge variant={DIFFICULTY_COLORS[q.difficulty]}>{q.difficulty}</Badge>
          </div>

          {/* Description */}
          {q.description && (
            <p className="text-sm text-slate-400 line-clamp-2 mb-3">
              {q.description.replace(/<[^>]*>/g, "").slice(0, 150)}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* XP Reward - Prominent */}
            {q.points > 0 && (
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                isBonusXP
                  ? "bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-amber-200 border border-amber-500/20"
                  : "bg-amber-500/15 text-amber-300 border border-amber-500/20"
              }`}>
                <Zap className="h-3.5 w-3.5" />
                {q.points * xpMultiplier} XP
              </span>
            )}

            {/* Submission count */}
            {q.submissionCount != null && q.submissionCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {q.submissionCount} attempt{q.submissionCount !== 1 ? "s" : ""}
              </span>
            )}

            {/* Languages */}
            {q.languages && q.languages.length > 0 && (
              <div className="flex items-center gap-1.5">
                {q.languages.slice(0, 3).map((lang) => (
                  <span
                    key={lang}
                    className="rounded-md bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-300"
                  >
                    {lang}
                  </span>
                ))}
                {q.languages.length > 3 && (
                  <span className="text-xs text-slate-500">+{q.languages.length - 3}</span>
                )}
              </div>
            )}

            {/* Tags */}
            {q.tags && q.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-slate-500" />
                {q.tags.slice(0, 2).map((t) => (
                  <span key={t} className="text-xs text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right icon */}
        <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
          isSolved
            ? "bg-emerald-500/20 group-hover:bg-emerald-500/30"
            : "bg-primary-500/20 group-hover:bg-primary-500/30 group-hover:scale-110"
        }`}>
          {isSolved ? (
            <Shield className="h-5 w-5 text-emerald-400" />
          ) : (
            <Swords className="h-5 w-5 text-primary-400" />
          )}
        </div>
      </div>
    </button>
  );
}

export default function QuestMapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "");
  const [language, setLanguage] = useState(searchParams.get("language") || "");
  const [tag, setTag] = useState(searchParams.get("tag") || "");

  const debouncedSearch = useDebounce(search, 400);

  const fetchQuestions = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (debouncedSearch) params.search = debouncedSearch;
        if (difficulty) params.difficulty = difficulty;
        if (language) params.language = language;
        if (tag) params.tag = tag;

        const res = await playgroundService.getQuestions(params);
        const data = res.data.data;
        setQuestions(data.questions);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setTotalQuestions(data.totalQuestions);
        if (data.availableTags?.length > 0) {
          setAvailableTags(data.availableTags);
        }
      } catch {
        setQuestions([]);
      }
      setLoading(false);
    },
    [debouncedSearch, difficulty, language, tag]
  );

  useEffect(() => {
    fetchQuestions(1);
  }, [fetchQuestions]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (difficulty) params.difficulty = difficulty;
    if (language) params.language = language;
    if (tag) params.tag = tag;
    setSearchParams(params, { replace: true });
  }, [search, difficulty, language, tag, setSearchParams]);

  const clearFilters = () => {
    setSearch("");
    setDifficulty("");
    setLanguage("");
    setTag("");
  };

  const hasFilters = search || difficulty || language || tag;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mc-glass p-6">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 border border-primary-500/30">
              <MapPin className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Quest Map</h1>
              <p className="text-sm text-slate-400">
                Choose your quest, earn XP, and climb the ranks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search quests by topic, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-36">
            <Select
              options={[
                { value: "", label: "All Levels" },
                { value: "Easy", label: "⚡ Easy" },
                { value: "Medium", label: "🔥 Medium" },
                { value: "Hard", label: "💀 Hard" },
              ]}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              options={[
                { value: "", label: "All Languages" },
                { value: "javascript", label: "JavaScript" },
                { value: "python", label: "Python" },
                { value: "java", label: "Java" },
                { value: "cpp", label: "C++" },
                { value: "c", label: "C" },
              ]}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>
          {availableTags.length > 0 && (
            <div className="w-40">
              <Select
                options={[
                  { value: "", label: "All Tags" },
                  ...availableTags.map((t) => ({ value: t, label: t })),
                ]}
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>
          )}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-sm text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1.5">
          <Swords className="h-4 w-4 text-primary-400" />
          {totalQuestions} quest{totalQuestions !== 1 ? "s" : ""} available
        </span>
        {hasFilters && (
          <span className="flex items-center gap-1.5">
            <Filter className="h-4 w-4" />
            Filtered
          </span>
        )}
        <span className="flex items-center gap-1.5 ml-auto">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <span className="text-amber-300 font-medium">Hard = 3x XP</span>
        </span>
      </div>

      {/* Quest List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-10 w-10 text-primary-400" />}
          title="No quests found"
          description={
            hasFilters ? "Try adjusting your filters" : "No quests available yet"
          }
          action={
            hasFilters ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-primary-400 hover:text-primary-300 cursor-pointer"
              >
                Clear Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestCard
              key={q._id}
              q={q}
              onClick={() => navigate(`/arena/${q._id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchQuestions(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => fetchQuestions(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
