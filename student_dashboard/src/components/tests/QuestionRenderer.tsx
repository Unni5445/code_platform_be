import type { IQuestion } from "@/types";
import { MCQQuestion } from "./MCQQuestion";
import { CodingQuestion } from "./CodingQuestion";

interface QuestionRendererProps {
  question: IQuestion;
  answer: string | string[];
  code: string;
  language: string;
  onAnswerChange: (answer: string | string[]) => void;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
  onSubmitCode?: () => void;
}

export function QuestionRenderer({
  question,
  answer,
  code,
  language,
  onAnswerChange,
  onCodeChange,
  onLanguageChange,
  onSubmitCode,
}: QuestionRendererProps) {
  switch (question.type) {
    case "SINGLE_CHOICE":
    case "MULTIPLE_CHOICE":
      return (
        <MCQQuestion
          question={question}
          answer={answer}
          onChange={onAnswerChange}
        />
      );

    case "CODING":
      return (
        <CodingQuestion
          question={question}
          code={code}
          language={language}
          onCodeChange={onCodeChange}
          onLanguageChange={onLanguageChange}
          onSubmitCode={onSubmitCode}
        />
      );

    case "BEHAVIORAL":
      return (
        <div className="space-y-2">
          <textarea
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
          />
        </div>
      );

    default:
      return <p className="text-gray-500">Unsupported question type</p>;
  }
}
