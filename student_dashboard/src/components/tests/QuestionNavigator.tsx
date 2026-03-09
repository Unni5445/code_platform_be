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
              "h-10 w-10 rounded-lg text-sm font-medium transition-all cursor-pointer",
              isCurrent
                ? "bg-primary-600 text-white shadow-md"
                : isAnswered
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
