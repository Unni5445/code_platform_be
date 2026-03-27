import axios from "axios";

const PISTON_API = `${process.env.PISTON_API_URL}/api/v2`;

// ── Limits ───────────────────────────────────────────────────────────────────
const COMPILE_TIMEOUT   = 10_000;       // 10 s
const RUN_TIMEOUT       = 5_000;        // 5 s
const COMPILE_MEMORY    = 256_000_000;  // 256 MB
const RUN_MEMORY        = 256_000_000;  // 256 MB
const MAX_OUTPUT_SIZE   = 65_536;       // 64 KB
const MAX_CODE_SIZE     = 65_536;       // 64 KB
const MAX_STDIN_SIZE    = 1_048_576;    // 1 MB
const MAX_PROCESS_LIMIT = 32;

// ── Language registry ────────────────────────────────────────────────────────
// `filename` is required by Piston for compiled languages.
// Java: filename MUST be "Solution.java" to match the public class name we inject.
export const PISTON_LANGUAGES: Record<
  string,
  { language: string; version: string; filename: string }
> = {
  javascript: { language: "javascript", version: "20.11.1", filename: "solution.js"   },
  python:     { language: "python",     version: "3.12.0",  filename: "solution.py"   },
  java:       { language: "java",       version: "15.0.2",  filename: "Solution.java" }, // filename must match public class name
  cpp:        { language: "c++",        version: "10.2.0",  filename: "solution.cpp"  },
  c:          { language: "c",          version: "10.2.0",  filename: "solution.c"    },
  typescript: { language: "typescript", version: "5.0.3",   filename: "solution.ts"   },
};

export interface PistonResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
}

// ── Main entry point ─────────────────────────────────────────────────────────
export async function executeCode(
  language: string,
  code: string,
  stdin?: string,
): Promise<PistonResult> {
  const langConfig = PISTON_LANGUAGES[language];
  if (!langConfig) throw new Error(`Unsupported language: ${language}`);

  if (code.length > MAX_CODE_SIZE)
    throw new Error(`Code exceeds maximum size of ${MAX_CODE_SIZE} bytes`);
  if (stdin && stdin.length > MAX_STDIN_SIZE)
    throw new Error(`Input exceeds maximum size of ${MAX_STDIN_SIZE} bytes`);

  const finalCode = injectHarness(language, code);

  const response = await axios.post(
    `${PISTON_API}/execute`,
    {
      language: langConfig.language,
      version:  langConfig.version,
      files:    [{ name: langConfig.filename, content: finalCode }],
      stdin:    stdin ?? "",
      // compile_timeout:      COMPILE_TIMEOUT,
      // run_timeout:          RUN_TIMEOUT,
      // compile_memory_limit: COMPILE_MEMORY,
      // run_memory_limit:     RUN_MEMORY,
      // output_limit:         MAX_OUTPUT_SIZE,
      // process_limit:        MAX_PROCESS_LIMIT,
    },
    { timeout: COMPILE_TIMEOUT + RUN_TIMEOUT + 5_000 },
  );

  const run = response.data.run;

  return {
    stdout: (run.stdout ?? "").slice(0, MAX_OUTPUT_SIZE),
    stderr: (run.stderr ?? "").slice(0, MAX_OUTPUT_SIZE),
    output: (run.output  ?? "").slice(0, MAX_OUTPUT_SIZE),
    code:   run.code,
    signal: run.signal,
  };
}

// ── Harness injection router ─────────────────────────────────────────────────
function injectHarness(language: string, code: string): string {
  switch (language) {
    case "javascript":
    case "typescript": return injectJS(code);   // TS uses same Node harness
    case "python":     return injectPython(code);
    case "java":       return injectJava(code);
    case "cpp":        return injectCpp(code);
    case "c":          return injectC(code);
    default:           return code;
  }
}

// ── JavaScript ───────────────────────────────────────────────────────────────
// Supports: `function foo(` | `const foo = (` | `const foo = function`
function detectJSFunctionName(code: string): string | null {
  const patterns = [
    /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,          // function foo(
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(/,         // const foo = (
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/,   // const foo = function
  ];
  for (const re of patterns) {
    const m = code.match(re);
    if (m) return m[1];
  }
  return null;
}

function injectJS(code: string): string {
  const fn = detectJSFunctionName(code);
  if (!fn) return code; // user handles I/O themselves

  return `${code}

const _lines = require('fs').readFileSync(0, 'utf-8').trim().split('\\n');
const _parsed = _lines.map(l => {
  const n = Number(l);
  return isNaN(n) ? l : n;
});
const _input = _parsed.length === 1 ? _parsed[0] : _parsed;
const _result = ${fn}(_input);
console.log(Array.isArray(_result) ? _result.join('\\n') : _result);
`;
}

// ── Python ───────────────────────────────────────────────────────────────────
function detectPythonFunctionName(code: string): string | null {
  const m = code.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/m);
  return m ? m[1] : null;
}

function injectPython(code: string): string {
  const fn = detectPythonFunctionName(code);
  if (!fn) return code;

  return `${code}

import sys as _sys
_raw = _sys.stdin.read().strip()
_lines = _raw.split('\\n')

def _parse(s):
    try: return int(s)
    except ValueError:
        try: return float(s)
        except ValueError: return s

if len(_lines) == 1:
    _input = _parse(_lines[0])
else:
    _input = [_parse(l) for l in _lines]

_result = ${fn}(_input)
if isinstance(_result, list):
    print('\\n'.join(str(x) for x in _result))
else:
    print(_result)
`;
}

// ── Java ─────────────────────────────────────────────────────────────────────
// User writes a plain method (no class wrapper). We wrap it in a Solution class.
// If the user already wrote a full class, pass through unchanged.
//
// Example user code:
//   int add(int a, int b) { return a + b; }
function detectJavaMethodName(code: string): string | null {
  if (/\bclass\s+\w+/.test(code)) return null; // user wrote a full class
  const m = code.match(
    /(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
  );
  return m && m[1] !== "main" ? m[1] : null;
}

function injectJava(code: string): string {
  // Full class supplied — trust their own main / I/O
  if (/\bclass\s+\w+/.test(code)) return code;

  const fn = detectJavaMethodName(code);
  if (!fn) return code;

  return `import java.util.*;
import java.io.*;

public class Solution {
    ${code.trim()}

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) lines.add(trimmed);
        }

        Solution sol = new Solution();
        Object result;

        if (lines.isEmpty()) {
            result = sol.${fn}();
        } else if (lines.size() == 1) {
            String val = lines.get(0);
            try {
                result = sol.${fn}(Integer.parseInt(val));
            } catch (NumberFormatException e1) {
                try {
                    result = sol.${fn}(Double.parseDouble(val));
                } catch (NumberFormatException e2) {
                    result = sol.${fn}(val);
                }
            }
        } else {
            String[] arr = lines.toArray(new String[0]);
            result = sol.${fn}(arr);
        }

        if (result instanceof int[])         System.out.println(Arrays.toString((int[]) result));
        else if (result instanceof long[])   System.out.println(Arrays.toString((long[]) result));
        else if (result instanceof Object[]) System.out.println(Arrays.toString((Object[]) result));
        else                                 System.out.println(result);
    }
}
`;
}

// ── C++ ──────────────────────────────────────────────────────────────────────
// If user already wrote main(), pass through. Otherwise detect first free
// function and generate a main() that reads stdin and calls it.
//
// Example user code:
//   long long twoSum(long long n) { return n * 2; }
function detectCppFunctionName(code: string): string | null {
  if (/\bint\s+main\s*\(/.test(code)) return null;
  const m = code.match(/[\w:]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/);
  return m && m[1] !== "main" ? m[1] : null;
}

function injectCpp(code: string): string {
  if (/\bint\s+main\s*\(/.test(code)) return code;

  const fn = detectCppFunctionName(code);
  if (!fn) return code;

  return `#include <bits/stdc++.h>
using namespace std;

${code.trim()}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string raw;
    getline(cin, raw);

    // Try integer first, fall back to string
    stringstream ss(raw);
    long long num;
    if (ss >> num && ss.eof()) {
        cout << ${fn}(num) << endl;
    } else {
        cout << ${fn}(raw) << endl;
    }
    return 0;
}
`;
}

// ── C ────────────────────────────────────────────────────────────────────────
// Same strategy as C++ but with C-style I/O.
//
// Example user code:
//   int square(int n) { return n * n; }
function detectCFunctionName(code: string): string | null {
  if (/\bint\s+main\s*\(/.test(code)) return null;
  const m = code.match(/[\w]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/);
  return m && m[1] !== "main" ? m[1] : null;
}

function injectC(code: string): string {
  if (/\bint\s+main\s*\(/.test(code)) return code;

  const fn = detectCFunctionName(code);
  if (!fn) return code;

  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${code.trim()}

int main(void) {
    char buf[4096];
    if (!fgets(buf, sizeof(buf), stdin)) buf[0] = '\\0';
    buf[strcspn(buf, "\\n")] = '\\0'; // strip newline

    char *end;
    long long num = strtoll(buf, &end, 10);
    if (end != buf && *end == '\\0') {
        // Input is a plain integer
        printf("%lld\\n", (long long)${fn}((int)num));
    } else {
        // Input is a string — function must accept char*
        printf("%s\\n", (char*)${fn}(buf));
    }
    return 0;
}
`;
}

// ── Exported helpers (useful for unit tests) ─────────────────────────────────
export const _detect = {
  js:         detectJSFunctionName,
  typescript: detectJSFunctionName,   // same detector
  python:     detectPythonFunctionName,
  java:       detectJavaMethodName,
  cpp:        detectCppFunctionName,
  c:          detectCFunctionName,
};