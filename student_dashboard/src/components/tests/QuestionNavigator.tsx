import clsx from "clsx";

interface QuestionNavigatorProps {
  total: number;
  current: number;
  answeredIndices: Set<number>;
  onNavigate: (index: number) => void;
}

export function QuestionNavigator({ total, current, answeredIndices, onNavigate }: QuestionNavigatorProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: total }, (_, i) => {
        const isAnswered = answeredIndices.has(i);
        const isCurrent = i === current;

        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={clsx(
              "h-10 w-10 rounded-lg text-sm font-bold transition-all cursor-pointer border shadow-xs",
              isCurrent
                ? "bg-primary-600 text-white border-primary-500 shadow-md shadow-primary-500/20"
                : isAnswered
                ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
