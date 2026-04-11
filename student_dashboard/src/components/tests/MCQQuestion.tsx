import clsx from "clsx";
import { Check } from "lucide-react";
import type { IQuestion } from "@/types";

interface MCQQuestionProps {
  question: IQuestion;
  answer: string | string[];
  onChange: (answer: string | string[]) => void;
}

export function MCQQuestion({ question, answer, onChange }: MCQQuestionProps) {
  const isMultiple = question.type === "MULTIPLE_CHOICE";
  const selectedAnswers = Array.isArray(answer) ? answer : answer ? [answer] : [];

  const handleSelect = (idx: string) => {
    if (isMultiple) {
      const newAnswers = selectedAnswers.includes(idx)
        ? selectedAnswers.filter((a) => a !== idx)
        : [...selectedAnswers, idx];
      onChange(newAnswers);
    } else {
      onChange(idx);
    }
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option, index) => {
        const optionIdx = String(index);
        const isSelected = selectedAnswers.includes(optionIdx);
        const letter = String.fromCharCode(65 + index);

        return (
          <button
            key={index}
            onClick={() => handleSelect(optionIdx)}
            className={clsx(
              "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md",
              isSelected
                ? "border-primary-500 bg-primary-50 shadow-primary-500/5"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div
              className={clsx(
                "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 shadow-xs",
                isSelected
                  ? "bg-primary-600 text-white"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {isSelected ? <Check className="h-5 w-5" /> : letter}
            </div>
            <span className={clsx("text-sm font-bold", isSelected ? "text-primary-700" : "text-slate-600")}>
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}
