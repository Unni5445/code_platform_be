import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Code2,
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  Zap,
  Filter,
} from "lucide-react";
import { Card, Badge, Spinner, EmptyState, Select } from "@/components/ui";
import { playgroundService } from "@/services";
import type { IQuestion } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

const DIFFICULTY_COLORS: Record<string, "success" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

export default function PlaygroundPage() {
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
      <div>
        <h1 className="text-2xl font-bold text-white">Playground</h1>
        <p className="mt-1 text-sm text-slate-400">
          Practice coding questions to sharpen your skills and build your streak
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
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
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
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
                { value: "csharp", label: "C#" },
                { value: "ruby", label: "Ruby" },
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
              className="px-3 py-2.5 text-sm text-slate-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </Card>

      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1.5">
          <Code2 className="h-4 w-4" />
          {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} available
        </span>
        {hasFilters && (
          <span className="flex items-center gap-1.5">
            <Filter className="h-4 w-4" />
            Filtered
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<Code2 className="h-10 w-10 text-primary-400" />}
          title="No questions found"
          description={
            hasFilters ? "Try adjusting your filters" : "No coding questions available yet"
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
            <button
              key={q._id}
              onClick={() => navigate(`/playground/${q._id}`)}
              className="w-full text-left rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 transition-all duration-200 hover:border-primary-500/40 hover:bg-slate-800/60 cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-base font-semibold text-white truncate group-hover:text-primary-300 transition-colors">
                      {q.title}
                    </h3>
                    <Badge variant={DIFFICULTY_COLORS[q.difficulty]}>{q.difficulty}</Badge>
                  </div>
                  {q.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                      {q.description.replace(/<[^>]*>/g, "").slice(0, 150)}
                    </p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {q.points > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-300">
                        <Zap className="h-3.5 w-3.5" />
                        {q.points} pts
                      </span>
                    )}
                    {q.languages && q.languages.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {q.languages.slice(0, 3).map((lang) => (
                          <span
                            key={lang}
                            className="rounded bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-300"
                          >
                            {lang}
                          </span>
                        ))}
                        {q.languages.length > 3 && (
                          <span className="text-xs text-slate-500">+{q.languages.length - 3}</span>
                        )}
                      </div>
                    )}
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
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 group-hover:bg-primary-500/30 transition-colors">
                  <Code2 className="h-5 w-5 text-primary-400" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

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
