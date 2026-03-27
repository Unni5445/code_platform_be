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

  const handleSelect = (option: string) => {
    if (isMultiple) {
      const newAnswers = selectedAnswers.includes(option)
        ? selectedAnswers.filter((a) => a !== option)
        : [...selectedAnswers, option];
      onChange(newAnswers);
    } else {
      onChange(option);
    }
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option, index) => {
        const isSelected = selectedAnswers.includes(option);
        const letter = String.fromCharCode(65 + index);

        return (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            className={clsx(
              "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer",
              isSelected
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            )}
          >
            <div
              className={clsx(
                "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                isSelected
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {isSelected ? <Check className="h-4 w-4" /> : letter}
            </div>
            <span className={clsx("text-sm", isSelected ? "text-primary-700 font-medium" : "")}>
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}
