import axios from "axios";

const PISTON_API = `${process.env.PISTON_API_URL}/api/v2`;

// ── Limits ──────────────────────────────────────────────
const COMPILE_TIMEOUT = 10_000;   // 10 s
const RUN_TIMEOUT = 5_000;        // 5 s
const COMPILE_MEMORY = 256_000_000; // 256 MB
const RUN_MEMORY = 256_000_000;     // 256 MB
const MAX_OUTPUT_SIZE = 65_536;     // 64 KB stdout cap
const MAX_CODE_SIZE = 65_536;       // 64 KB source cap
const MAX_STDIN_SIZE = 1_048_576;   // 1 MB input cap
const MAX_PROCESS_LIMIT = 32;       // max processes/threads

export const PISTON_LANGUAGES: Record<
  string,
  { language: string; version: string }
> = {
  javascript: { language: "javascript", version: "20.11.1" },
  python: { language: "python", version: "3.12.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "c++", version: "10.2.0" },
  csharp: { language: "csharp", version: "6.12.0" },
  ruby: { language: "ruby", version: "3.0.1" },
  c: { language: "c", version: "10.2.0" },
};

export interface PistonResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
}

export async function executeCode(
  language: string,
  code: string,
  stdin?: string,
): Promise<PistonResult> {
  const langConfig = PISTON_LANGUAGES[language];
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // ── Validate input sizes ──
  if (code.length > MAX_CODE_SIZE) {
    throw new Error(`Code exceeds maximum size of ${MAX_CODE_SIZE} bytes`);
  }
  if (stdin && stdin.length > MAX_STDIN_SIZE) {
    throw new Error(`Input exceeds maximum size of ${MAX_STDIN_SIZE} bytes`);
  }

  const functionName = getFunctionName(language, code);

  let codeWithInput = code;

  if (functionName) {
    if (language === "javascript") {
      codeWithInput = `${code}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
console.log(${functionName}(input));
`;
    }

    if (language === "python") {
      codeWithInput = `${code}

import sys
input_data = sys.stdin.read().strip()

try:
    input_data = int(input_data)
except:
    pass

print(${functionName}(input_data))
`;
    }
  }

  const response = await axios.post(
    `${PISTON_API}/execute`,
    {
      language: langConfig.language,
      version: langConfig.version,
      files: [{ content: codeWithInput }],
      stdin: stdin || "",
      // compile_timeout: COMPILE_TIMEOUT,
      // run_timeout: RUN_TIMEOUT,
      // compile_memory_limit: COMPILE_MEMORY,
      // run_memory_limit: RUN_MEMORY,
      // output_limit: MAX_OUTPUT_SIZE,
      // process_limit: MAX_PROCESS_LIMIT,
    },
    { timeout: COMPILE_TIMEOUT + RUN_TIMEOUT + 5_000 } // axios timeout as safety net
  );

  const run = response.data.run;
  const stdout = (run.stdout || "").slice(0, MAX_OUTPUT_SIZE);
  const stderr = (run.stderr || "").slice(0, MAX_OUTPUT_SIZE);

  return {
    stdout,
    stderr,
    output: (run.output || "").slice(0, MAX_OUTPUT_SIZE),
    code: run.code,
    signal: run.signal,
  };
}

function getJSFunctionName(code: string) {
  const match = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
  return match ? match[1] : null;
}

function getPythonFunctionName(code: string) {
  const match = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
  return match ? match[1] : null;
}

function getFunctionName(language: string, code: string) {
  if (language === "javascript") {
    return getJSFunctionName(code);
  }

  if (language === "python") {
    return getPythonFunctionName(code);
  }

  return null;
}
