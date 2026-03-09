import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { codeService } from "@/services";
import type { TestCaseResult } from "@/services/code.service";
import type { IQuestion } from "@/types";

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  csharp: "csharp",
  ruby: "ruby",
};

interface CodingQuestionProps {
  question: IQuestion;
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
}

export function CodingQuestion({
  question,
  code,
  language,
  onCodeChange,
  onLanguageChange,
}: CodingQuestionProps) {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[] | null>(null);
  const [passedCount, setPassedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const availableLanguages = question.languages || ["javascript", "python"];
  const languageOptions = availableLanguages.map((lang: string) => ({
    value: lang,
    label: lang.charAt(0).toUpperCase() + lang.slice(1),
  }));

  const handleLanguageChange = (newLang: string) => {
    onLanguageChange(newLang);
    const starterCode = question.starterCode?.[newLang] || "";
    if (starterCode && !code) {
      onCodeChange(starterCode);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    setHasError(false);
    setTestCaseResults(null);

    try {
      const res = await codeService.runTestCases(question._id, language, code);
      const data = res.data.data;
      setTestCaseResults(data.results);
      setPassedCount(data.passed);
      setTotalCount(data.total);
    } catch {
      setOutput("Error: Failed to run test cases. Please try again.");
      setHasError(true);
    }

    setIsRunning(false);
  };

  return (
    <div className="space-y-4">
      {/* Language Selector & Run Button */}
      <div className="flex items-center justify-between">
        <Select
          options={languageOptions}
          value={language}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleLanguageChange(e.target.value)}
          className="w-48"
        />
        <Button
          onClick={handleRun}
          disabled={isRunning || !code.trim()}
          leftIcon={isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          size="sm"
        >
          {isRunning ? "Running..." : "Run Code"}
        </Button>
      </div>

      {/* Code Editor */}
      <div className="rounded-xl overflow-hidden border border-surface-border">
        <Editor
          height="400px"
          language={MONACO_LANGUAGE_MAP[language] || language}
          value={code}
          onChange={(value) => onCodeChange(value || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
          }}
        />
      </div>

      {/* Test Case Results */}
      {testCaseResults && (
        <div className="rounded-xl border border-surface-border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-surface-border flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Test Cases</span>
            <span className={`text-sm font-medium ${passedCount === totalCount ? "text-emerald-600" : "text-amber-600"}`}>
              {passedCount}/{totalCount} Passed
            </span>
          </div>
          <div className="divide-y divide-surface-border">
            {testCaseResults.map((tc, i) => (
              <div key={i} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {tc.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${tc.passed ? "text-emerald-600" : "text-red-600"}`}>
                    Test Case {i + 1}
                  </span>
                </div>
                {!tc.hidden && (
                  <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <p className="text-gray-500 mb-1 font-sans">Input</p>
                      <pre className="bg-gray-50 rounded p-2 whitespace-pre-wrap">{tc.input || "(empty)"}</pre>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1 font-sans">Expected</p>
                      <pre className="bg-gray-50 rounded p-2 whitespace-pre-wrap">{tc.expected}</pre>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1 font-sans">Actual</p>
                      <pre className={`rounded p-2 whitespace-pre-wrap ${tc.passed ? "bg-emerald-50" : "bg-red-50"}`}>
                        {tc.actual || "(empty)"}
                      </pre>
                    </div>
                  </div>
                )}
                {tc.hidden && !tc.passed && (
                  <p className="text-xs text-gray-400 ml-6">Hidden test case — wrong answer</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Output (fallback) */}
      {output && !testCaseResults && (
        <div className="rounded-xl border border-surface-border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-surface-border flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Output</span>
            {hasError && (
              <span className="text-xs font-medium text-red-600">Error</span>
            )}
          </div>
          <pre className={`p-4 text-sm font-mono bg-white whitespace-pre-wrap max-h-48 overflow-y-auto ${hasError ? "text-red-600" : "text-gray-800"}`}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
