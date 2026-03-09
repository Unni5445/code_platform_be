import { useState, type FormEvent } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button, Input, Select, Badge, RichTextEditor } from "@/components/ui";
import { courseService, testService } from "@/services";
import { useApi } from "@/hooks/useApi";
import type { IQuestion, ITest, QuestionType, Difficulty, TestCase } from "@/types";

interface QuestionFormProps {
  question?: IQuestion | null;
  onSubmit: (data: Partial<IQuestion>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  /** Pre-set these to hide the corresponding dropdowns */
  fixedCourseId?: string;
  fixedTestId?: string;
}

const ALLOWED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "ruby", label: "Ruby" },
];

export function QuestionForm({ question, onSubmit, onCancel, isLoading, fixedCourseId, fixedTestId }: QuestionFormProps) {
  // Basic fields
  const [title, setTitle] = useState(question?.title || "");
  const [description, setDescription] = useState(question?.description || "");
  const [type, setType] = useState<QuestionType>(question?.type || "SINGLE_CHOICE");
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty || "Medium");
  const [points, setPoints] = useState(question?.points?.toString() || "10");
  const [testId, setTestId] = useState(fixedTestId || question?.test || "");
  const [course, setCourse] = useState(fixedCourseId || question?.course || "");
  const [company, setCompany] = useState(question?.company || "");
  const [status, setStatus] = useState(question?.status || "DRAFT");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(question?.tags || []);
  const [submissionLimit, setSubmissionLimit] = useState(question?.submissionLimit?.toString() || "5");

  // Choice fields
  const [options, setOptions] = useState<string[]>(question?.options?.length ? question.options : ["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<string | string[]>(question?.correctAnswer || "");

  // Coding fields
  const [languages, setLanguages] = useState<string[]>(question?.languages || ["javascript"]);
  const [testCases, setTestCases] = useState<TestCase[]>(
    question?.testCases?.length ? question.testCases : [{ input: "", output: "", hidden: false, weight: 1 }]
  );
  const [starterCode, setStarterCode] = useState<Record<string, string>>(
    question?.starterCode && typeof question.starterCode === "object" ? { ...question.starterCode } : {}
  );
  const [maxExecutionTime, setMaxExecutionTime] = useState(question?.maxExecutionTime?.toString() || "2");
  const [maxMemory, setMaxMemory] = useState(question?.maxMemory?.toString() || "128");

  const { data: coursesData } = useApi(() => fixedCourseId ? Promise.resolve(null) : courseService.getCourses({ limit: 100 }), [fixedCourseId]);
  const coursesList = coursesData?.courses ?? [];

  const { data: testsData } = useApi(() => fixedTestId ? Promise.resolve(null) : testService.getTests({ limit: 100 }), [fixedTestId]);
  const testsList: ITest[] = testsData?.tests ?? [];

  const isChoiceType = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
  const isCodingType = type === "CODING";

  // --- Option helpers ---
  const addOption = () => setOptions([...options, ""]);
  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    // Clean up correctAnswer if removed option was selected
    if (type === "SINGLE_CHOICE" && correctAnswer === String(idx)) {
      setCorrectAnswer("");
    }
    if (type === "MULTIPLE_CHOICE" && Array.isArray(correctAnswer)) {
      setCorrectAnswer(correctAnswer.filter((a) => a !== String(idx)).map((a) => (Number(a) > idx ? String(Number(a) - 1) : a)));
    }
  };
  const updateOption = (idx: number, value: string) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  // --- Test case helpers ---
  const addTestCase = () => setTestCases([...testCases, { input: "", output: "", hidden: false, weight: 1 }]);
  const removeTestCase = (idx: number) => {
    if (testCases.length <= 1) return;
    setTestCases(testCases.filter((_, i) => i !== idx));
  };
  const updateTestCase = (idx: number, field: keyof TestCase, value: string | boolean | number) => {
    const updated = [...testCases];
    updated[idx] = { ...updated[idx], [field]: value };
    setTestCases(updated);
  };

  // --- Tag helpers ---
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
  };

  // --- Language toggle ---
  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang));
        const updated = { ...starterCode };
        delete updated[lang];
        setStarterCode(updated);
      }
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const updateStarterCode = (lang: string, code: string) => {
    setStarterCode({ ...starterCode, [lang]: code });
  };

  // --- Submit ---
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const data: Partial<IQuestion> = {
      title,
      description: description || undefined,
      type,
      difficulty,
      points: Number(points) || 0,
      test: testId || undefined,
      course: course || undefined,
      company: company || undefined,
      tags: tags.length > 0 ? tags : undefined,
      status: status as IQuestion["status"],
      submissionLimit: Number(submissionLimit) || undefined,
    };

    if (isChoiceType) {
      data.options = options.filter((o) => o.trim());
      data.correctAnswer = correctAnswer;
    }

    if (isCodingType) {
      data.languages = languages;
      data.testCases = testCases.filter((tc) => tc.input.trim() || tc.output.trim());
      data.maxExecutionTime = Number(maxExecutionTime) || 2;
      data.maxMemory = Number(maxMemory) || 128;
      // Only include starter code entries that have content
      const filteredStarterCode: Record<string, string> = {};
      for (const lang of languages) {
        if (starterCode[lang]?.trim()) filteredStarterCode[lang] = starterCode[lang];
      }
      if (Object.keys(filteredStarterCode).length > 0) data.starterCode = filteredStarterCode;
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Section: Basic Info ── */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h4>
        <Input
          label="Question Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Two Sum Problem"
        />
        <RichTextEditor
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Write a detailed question description with examples, constraints, etc."
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type *"
            options={[
              { value: "SINGLE_CHOICE", label: "Single Choice" },
              { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
              { value: "CODING", label: "Coding" },
              { value: "BEHAVIORAL", label: "Behavioral" },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
          />
          <Select
            label="Difficulty *"
            options={[
              { value: "Easy", label: "Easy" },
              { value: "Medium", label: "Medium" },
              { value: "Hard", label: "Hard" },
            ]}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Points"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="10"
          />
          <Select
            label="Status"
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
              { value: "ARCHIVED", label: "Archived" },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <Input
            label="Submission Limit"
            type="number"
            value={submissionLimit}
            onChange={(e) => setSubmissionLimit(e.target.value)}
            placeholder="5"
          />
        </div>
        {/* {(!fixedTestId || !fixedCourseId) && (
          <div className="grid grid-cols-2 gap-4">
            {!fixedTestId && (
              <Select
                label="Test"
                options={[
                  { value: "", label: "No Test (Question Bank)" },
                  ...testsList.map((t) => ({ value: t._id, label: t.title })),
                ]}
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
              />
            )}
            {!fixedCourseId && (
              <Select
                label="Course *"
                options={[
                  { value: "", label: "Select Course" },
                  ...coursesList.map((c) => ({ value: c._id, label: c.title })),
                ]}
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
            )}
          </div>
        )} */}
        <Input
          label="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g., Google, Amazon"
        />
      </div>

      {/* ── Section: Choice Options ── */}
      {isChoiceType && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Answer Options</h4>
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="text-gray-300">
                  <GripVertical className="h-4 w-4" />
                </div>
                {type === "SINGLE_CHOICE" ? (
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer.toString() === String(idx)}
                    onChange={() => setCorrectAnswer(String(idx))}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={Array.isArray(correctAnswer) && correctAnswer.toString().includes(String(idx))}
                    onChange={(e) => {
                      const current = Array.isArray(correctAnswer) ? correctAnswer : [];
                      setCorrectAnswer(
                        e.target.checked
                          ? [...current, String(idx)]
                          : current.filter((a) => a !== String(idx))
                      );
                    }}
                    className="w-4 h-4 rounded text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                )}
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  disabled={options.length <= 2}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addOption}>
            Add Option
          </Button>
          <p className="text-xs text-gray-500">
            {type === "SINGLE_CHOICE"
              ? "Select the radio button next to the correct answer."
              : "Check all correct answers."}
          </p>
        </div>
      )}

      {/* ── Section: Coding Config ── */}
      {isCodingType && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Coding Configuration</h4>

          {/* Languages */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Allowed Languages</label>
            <div className="flex flex-wrap gap-2">
              {ALLOWED_LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => toggleLanguage(lang.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    languages.includes(lang.value)
                      ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Execution limits */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Execution Time (s)"
              type="number"
              value={maxExecutionTime}
              onChange={(e) => setMaxExecutionTime(e.target.value)}
              placeholder="2"
            />
            <Input
              label="Max Memory (MB)"
              type="number"
              value={maxMemory}
              onChange={(e) => setMaxMemory(e.target.value)}
              placeholder="128"
            />
          </div>

          {/* Starter Code */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Starter Code</label>
            {languages.map((lang) => {
              const langLabel = ALLOWED_LANGUAGES.find((l) => l.value === lang)?.label || lang;
              return (
                <div key={lang} className="space-y-1">
                  <span className="text-xs font-medium text-gray-500">{langLabel}</span>
                  <textarea
                    value={starterCode[lang] || ""}
                    onChange={(e) => updateStarterCode(lang, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400"
                    placeholder={`// ${langLabel} starter code...`}
                  />
                </div>
              );
            })}
            <p className="text-xs text-gray-500">Provide boilerplate code students will start with for each language.</p>
          </div>

          {/* Test Cases */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Test Cases</label>
            {testCases.map((tc, idx) => (
              <div key={idx} className="p-4 bg-surface-secondary rounded-xl border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Test Case {idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={tc.hidden ?? false}
                        onChange={(e) => updateTestCase(idx, "hidden", e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      Hidden
                    </label>
                    <button
                      type="button"
                      onClick={() => removeTestCase(idx)}
                      disabled={testCases.length <= 1}
                      className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400"
                      placeholder="e.g., [2,7,11,15]\n9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Expected Output</label>
                    <textarea
                      value={tc.output}
                      onChange={(e) => updateTestCase(idx, "output", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400"
                      placeholder="e.g., [0,1]"
                    />
                  </div>
                </div>
                <Input
                  label="Weight"
                  type="number"
                  value={tc.weight?.toString() || "1"}
                  onChange={(e) => updateTestCase(idx, "weight", Number(e.target.value))}
                  placeholder="1"
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addTestCase}>
              Add Test Case
            </Button>
          </div>
        </div>
      )}

      {/* ── Section: Tags ── */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Tags</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type a tag and press Enter..."
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors"
          />
          <Button type="button" variant="outline" onClick={addTag}>Add</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="gray">
                <span className="flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-400 hover:text-red-500 cursor-pointer">&times;</button>
                </span>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading} disabled={!title.trim() || !course}>
          {question ? "Update Question" : "Create Question"}
        </Button>
      </div>
    </form>
  );
}
