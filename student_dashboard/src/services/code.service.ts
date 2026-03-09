import api from "./api";
import type { ApiResponse } from "@/types";

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
}

export interface TestCaseResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  hidden?: boolean;
}

export interface RunTestCasesResult {
  results: TestCaseResult[];
  passed: number;
  total: number;
}

export const codeService = {
  execute: (language: string, version: string, code: string, stdin?: string) =>
    api.post<ApiResponse<CodeExecutionResult>>("/code/execute", {
      language,
      version,
      code,
      stdin,
    }),

  runTestCases: (questionId: string, language: string, code: string) =>
    api.post<ApiResponse<RunTestCasesResult>>(`/questions/${questionId}/run-tests`, {
      language,
      code,
    }),
};
