import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Loader2, Send, CheckCircle2, XCircle } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { codeService } from "@/services";
import type { TestCaseResult } from "@/services/code.service";
import type { IQuestion } from "@/types";
import toast from "react-hot-toast";

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  c:"c"
};

interface CodingQuestionProps {
  question: IQuestion;
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
  onSubmitCode?: () => void;
}

export function CodingQuestion({
  question,
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onSubmitCode,
}: CodingQuestionProps) {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [customInput, setCustomInput] = useState("");
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
    onCodeChange(starterCode);
  };

  const handleRun = async () => {
    if (!customInput.trim()) {
      toast.error("Please provide input before running");
      return;
    }
    setIsRunning(true);
    setOutput("");
    setHasError(false);
    setTestCaseResults(null);

    try {
      const res = await codeService.execute(language, "latest", code, customInput);
      const data = res.data.data;
      if (data.stderr) {
        setOutput(data.stderr);
        setHasError(true);
      } else {
        setOutput(data.stdout || data.output || "(no output)");
      }
    } catch {
      setOutput("Error: Failed to run code. Please try again.");
      setHasError(true);
    }

    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setIsSubmitting(true);
    setOutput("");
    setHasError(false);
    setTestCaseResults(null);

    try {
      const res = await codeService.runTestCases(question._id, language, code);
      const data = res.data.data;
      setTestCaseResults(data.results);
      setPassedCount(data.passed);
      setTotalCount(data.total);

      if (data.passed === data.total) {
        toast.success(`All ${data.total} test cases passed!`);
      } else {
        toast.error(`${data.passed}/${data.total} test cases passed`);
      }

      onSubmitCode?.();
    } catch {
      toast.error("Failed to submit code. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Language Selector & Run/Submit Buttons */}
      <div className="flex items-center justify-between">
        <Select
          options={languageOptions}
          value={language}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleLanguageChange(e.target.value)}
          className="w-48 font-bold border-slate-200"
        />
        <div className="flex gap-2">
          <Button
            onClick={handleRun}
            disabled={isRunning || isSubmitting || !code.trim()}
            leftIcon={isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            size="sm"
            variant="secondary"
          >
            {isRunning ? "Running..." : "Run Code"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting || !code.trim()}
            leftIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            size="sm"
          >
            {isSubmitting ? "Submitting..." : "Submit Code"}
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <Editor
          height="400px"
          language={MONACO_LANGUAGE_MAP[language] || language}
          value={code}
          onChange={(value) => onCodeChange(value || "")}
          theme="light"
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

      {/* Custom Input */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Custom Input</span>
        </div>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Enter input for your code here..."
          className="w-full resize-none bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          rows={3}
        />
      </div>

      {/* Run Output */}
      {output && (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-4">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Output</span>
            {hasError && (
              <span className="text-xs font-bold text-red-600">Execution Error</span>
            )}
          </div>
          <pre className={`p-4 text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed ${hasError ? "text-red-700 bg-red-50" : "text-slate-800 bg-white"}`}>
            {output}
          </pre>
        </div>
      )}

      {/* Test Case Results (after Submit) */}
      {testCaseResults && (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-4">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Test Results</span>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${passedCount === totalCount ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-amber-700 bg-amber-50 border-amber-100"}`}>
              {passedCount} / {totalCount} Passed
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {testCaseResults.map((tc, i) => (
              <div key={i} className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  {tc.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-bold ${tc.passed ? "text-emerald-700" : "text-red-700"}`}>
                    Test Case {i + 1}
                  </span>
                </div>
                {!tc.hidden && (
                  <div className="grid grid-cols-3 gap-4 text-[10px] font-bold">
                    <div>
                      <p className="text-slate-400 mb-1.5 uppercase tracking-wider">Input</p>
                      <pre className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 whitespace-pre-wrap text-slate-900 shadow-sm">{tc.input || "(empty)"}</pre>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1.5 uppercase tracking-wider">Expected</p>
                      <pre className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 whitespace-pre-wrap text-emerald-900 shadow-sm">{tc.expected}</pre>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1.5 uppercase tracking-wider">Actual</p>
                      <pre className={`rounded-lg p-2.5 whitespace-pre-wrap border shadow-sm ${tc.passed ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-900"}`}>
                        {tc.actual || "(empty)"}
                      </pre>
                    </div>
                  </div>
                )}
                {tc.hidden && !tc.passed && (
                  <p className="text-xs font-medium text-slate-400 ml-6 italic">Hidden test case failed</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
