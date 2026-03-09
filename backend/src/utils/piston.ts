import axios from "axios";

const PISTON_API = "https://40b3-157-51-126-35.ngrok-free.app/api/v2";

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

  console.log({
    language: langConfig.language,
    version: langConfig.version,
    files: [{ content: code }],
    stdin: stdin || "",
    compile_timeout: 10000,
    run_timeout: 5000,
    compile_memory_limit: -1,
    run_memory_limit: -1,
  });

  const functionName = getFunctionName(language, code);

  let codeWithInput = code;

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

  const response = await axios.post(`${PISTON_API}/execute`, {
    language: langConfig.language, // e.g., "nodejs"
    version: langConfig.version, // e.g., "20"
    files: [{ content: codeWithInput }],
    stdin: stdin || "",
  });

  console.log(response)

  const run = response.data.run;
  return {
    stdout: run.stdout || "",
    stderr: run.stderr || "",
    output: run.output || "",
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
