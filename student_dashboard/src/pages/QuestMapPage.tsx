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
import { Badge, Spinner, EmptyState, Select, Card, Button } from "@/components/ui";
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
          ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
          : isHot
          ? "border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 hover:border-amber-300 hover:shadow-md"
          : "border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm"
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">
                <Flame className="h-3 w-3" /> Hot
              </span>
            )}
            {isBonusXP && !isSolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                <Star className="h-3 w-3" /> Bonus XP
              </span>
            )}
            {isSolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Conquered
              </span>
            )}
          </div>

          {/* Title + Difficulty */}
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className={`text-base font-semibold truncate transition-colors ${
              isSolved ? "text-emerald-800 group-hover:text-emerald-900" : "text-slate-900 group-hover:text-primary-700"
            }`}>
              {q.title}
            </h3>
            <Badge variant={DIFFICULTY_COLORS[q.difficulty]}>{q.difficulty}</Badge>
          </div>

          {/* Description */}
          {q.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mb-3">
              {q.description.replace(/<[^>]*>/g, "").slice(0, 150)}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* XP Reward - Prominent */}
            {q.points > 0 && (
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                isBonusXP
                  ? "bg-linear-to-r from-purple-100 to-amber-100 text-orange-800 border border-orange-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                <Zap className="h-3.5 w-3.5" />
                {q.points * xpMultiplier} XP
              </span>
            )}

            {/* Submission count */}
            {q.submissionCount != null && q.submissionCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
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
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200"
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
            ? "bg-emerald-50 border border-emerald-100"
            : "bg-primary-50 border border-primary-100 group-hover:scale-110"
        }`}>
          {isSolved ? (
            <Shield className="h-5 w-5 text-emerald-600" />
          ) : (
            <Swords className="h-5 w-5 text-primary-600" />
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
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl p-8 group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-50 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-secondary-50 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 border border-primary-100 shadow-inner">
              <MapPin className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">The Quest Map</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Explore algorithmic challenges, conquer nodes, and earn legendary XP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm self-start md:self-center">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Swords className="h-4 w-4 text-primary-500" />
              {totalQuestions} Active Quests
            </span>
          </div>
        </div>
      </div>

      {/* Filters Board */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl relative z-20">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px]">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Keywords</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Find challenges by title, company, or concept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-44">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Difficulty</label>
            <Select
              options={[
                { value: "", label: "All Levels" },
                { value: "Easy", label: "⚡ Easy" },
                { value: "Medium", label: "🔥 Medium" },
                { value: "Hard", label: "💀 Hard" },
              ]}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-slate-50 border-slate-100 font-bold p-3.5 rounded-2xl"
            />
          </div>

          <div className="w-full sm:w-48">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Language</label>
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
              className="bg-slate-50 border-slate-100 font-bold p-3.5 rounded-2xl"
            />
          </div>

          {availableTags.length > 0 && (
            <div className="w-full sm:w-48">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
              <Select
                options={[
                  { value: "", label: "All Topics" },
                  ...availableTags.map((t) => ({ value: t, label: t })),
                ]}
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="bg-slate-50 border-slate-100 font-bold p-3.5 rounded-2xl"
              />
            </div>
          )}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-6 py-3.5 text-xs font-bold text-slate-500 hover:text-red-600 cursor-pointer transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Rewards Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Higher Difficulty = <span className="text-primary-600 ml-1">Up to 3x XP Rewards</span>
        </div>
        {hasFilters && (
          <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary-100">
            <Filter className="h-3 w-3" /> Filters Applied
          </div>
        )}
      </div>

      {/* Quest List */}
      {loading ? (
        <div className="flex justify-center items-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Spinner size="lg" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-xl py-20 text-center">
          <EmptyState
            icon={<MapPin className="h-16 w-16 text-slate-200 mx-auto" />}
            title="Beyond the Known Map"
            description={
              hasFilters ? "No quests match your current visibility filters. Try clearing some constraints!" : "The quest board is currently empty. Check back for new deployments soon."
            }
            action={
              hasFilters ? (
                <Button
                  onClick={clearFilters}
                  variant="primary"
                  className="font-bold rounded-2xl px-8 shadow-lg shadow-primary-500/20"
                >
                  Clear All Filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <QuestCard
              key={q._id}
              q={q}
              onClick={() => navigate(`/arena/${q._id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 px-4">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em]">
            Node <span className="text-slate-900">{currentPage}</span> of {totalPages} in the sector
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchQuestions(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center justify-center w-12 h-12 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-primary-600 hover:border-primary-300 hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => fetchQuestions(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center justify-center w-12 h-12 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-primary-600 hover:border-primary-300 hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
