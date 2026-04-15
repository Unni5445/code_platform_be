import dotenv from "dotenv";
import path from "path";

// Load environment variables BEFORE importing piston utility
dotenv.config({ path: path.join(__dirname, "../.env") });

const { executeCode } = require("../src/utils/piston");

interface TestCase {
  id: string;
  category: string;
  name: string;
  language: string;
  code: string;
  stdin?: string;
  expectedResult: string;
  expectedSignal?: string | null;
  expectedCode?: number | null;
}

const TEST_SUITE: TestCase[] = [
  // 1. CPU Abuse Tests
  {
    id: "1.1",
    category: "CPU Abuse",
    name: "Infinite Loop",
    language: "python",
    code: "while True: pass",
    expectedResult: "Timeout or Signal (SIGXCPU/SIGKILL)",
    expectedSignal: "SIGKILL", 
  },
  {
    id: "1.2",
    category: "CPU Abuse",
    name: "Heavy Computation",
    language: "python",
    code: "while True: x = 123456789 ** 123456",
    expectedResult: "Timeout",
    expectedSignal: "SIGKILL",
  },
  {
    id: "1.3",
    category: "CPU Abuse",
    name: "Recursive Loop",
    language: "python",
    code: "def f(): return f()\nf()",
    expectedResult: "RecursionError or Runtime Error",
    expectedCode: 1,
  },
  {
    id: "1.4",
    category: "CPU Abuse",
    name: "Multi-Thread CPU Attack",
    language: "python",
    code: `import threading\ndef burn():\n    while True: pass\nfor _ in range(100):\n    threading.Thread(target=burn).start()`,
    expectedResult: "Thread/Process limits enforced",
  },

  // 2. Memory Abuse Tests
  {
    id: "2.1",
    category: "Memory Abuse",
    name: "Memory Explosion",
    language: "python",
    code: `a=[]\nwhile True:\n    a.append("A"*1000000)`,
    expectedResult: "Memory limit reached / SIGKILL",
    expectedSignal: "SIGKILL",
  },
  {
    id: "2.2",
    category: "Memory Abuse",
    name: "Huge Allocation",
    language: "python",
    code: "x = [0] * (10**9)",
    expectedResult: "Memory allocation failure / MemoryError",
    expectedCode: 1,
  },
  {
    id: "2.3",
    category: "Memory Abuse",
    name: "Recursive Memory Growth",
    language: "python",
    code: `def f(a):\n    return f(a+[0])\nf([])`,
    expectedResult: "Memory error or recursion limit",
  },

  // 3. Disk Abuse Tests
  {
    id: "3.1",
    category: "Disk Abuse",
    name: "Infinite File Write",
    language: "python",
    code: `while True:\n    try:\n        with open("spam.txt","a") as f:\n            f.write("A"*100000)\n    except Exception as e: print(e); break`,
    expectedResult: "Disk quota reached / SIGXFSZ",
  },
  {
    id: "3.2",
    category: "Disk Abuse",
    name: "Massive File Creation",
    language: "python",
    code: `import os\nfor i in range(1000):\n    try:\n        open(f"file{i}.txt","w").write("x")\n    except Exception as e: print(e); break`,
    expectedResult: "File creation limited",
  },
  {
    id: "3.3",
    category: "Disk Abuse",
    name: "Large File Write",
    language: "python",
    code: `with open("big.bin","wb") as f:\n    f.write(b"A"*100_000_000)`,
    expectedResult: "File size limit enforced",
  },

  // 4. Process Explosion Tests
  {
    id: "4.1",
    category: "Process Explosion",
    name: "Bash Fork Bomb",
    language: "python",
    code: `import os\nos.system(":(){ :|:& };:")`,
    expectedResult: "Process limit enforced",
  },
  {
    id: "4.2",
    category: "Process Explosion",
    name: "C Fork Bomb",
    language: "c",
    code: `#include <unistd.h>\nint main() { while(1) fork(); }`,
    expectedResult: "Process creation blocked",
  },
  {
    id: "4.3",
    category: "Process Explosion",
    name: "Python Fork Bomb",
    language: "python",
    code: `import os\nwhile True:\n    try: os.fork()\n    except: break`,
    expectedResult: "Process limit triggered",
  },

  // 5. Output Flooding Tests
  {
    id: "5.1",
    category: "Output Flooding",
    name: "Massive Output",
    language: "python",
    code: 'print("A"*10000000)',
    expectedResult: "Output truncated",
  },
  {
    id: "5.2",
    category: "Output Flooding",
    name: "Infinite Printing",
    language: "python",
    code: 'while True: print("spam")',
    expectedResult: "Timeout triggered",
    expectedSignal: "SIGKILL",
  },

  // 6. Network Escape Tests
  {
    id: "6.1",
    category: "Network Escape",
    name: "HTTP Request",
    language: "python",
    code: `import urllib.request\ntry:\n    urllib.request.urlopen("http://google.com", timeout=2)\n    print("SUCCESS")\nexcept Exception as e:\n    print(f"FAILED: {e}")`,
    expectedResult: "Connection fails",
  },
  {
    id: "6.2",
    category: "Network Escape",
    name: "Socket Connection",
    language: "python",
    code: `import socket\ns = socket.socket()\ntry:\n    s.connect(("8.8.8.8", 53))\n    print("CONNECTED")\nexcept Exception as e: print(f"DENIED: {e}")`,
    expectedResult: "Connection denied",
  },

  // 7. File System Escape Tests
  {
    id: "7.1",
    category: "FS Escape",
    name: "Read System File",
    language: "python",
    code: `try:\n    print(open("/etc/passwd").read())\nexcept Exception as e:\n    print(e)`,
    expectedResult: "Restricted or inaccessible",
  },
  {
    id: "7.2",
    category: "FS Escape",
    name: "List Root Directory",
    language: "python",
    code: `import os\ntry: print(os.listdir("/"))\nexcept Exception as e: print(e)`,
    expectedResult: "Sandbox directory only",
  },

  // 8. Environment Variable Leak
  {
    id: "8.1",
    category: "Env Leak",
    name: "Inspect Environ",
    language: "python",
    code: `import os\nprint(os.environ)`,
    expectedResult: "Minimal variables only",
  },

  // 9.2 Macro Expansion
  {
    id: "9.2",
    category: "Compiler Abuse",
    name: "Macro Expansion",
    language: "c",
    code: `#define A A A\nA\nint main() { return 0; }`,
    expectedResult: "Compile failure or timeout",
  },
  // 9.3 Massive Source File
  {
    id: "9.3",
    category: "Compiler Abuse",
    name: "Massive Source File",
    language: "python",
    code: 'print("x")\n' + '# padding\n'.repeat(50000), // ~600KB
    expectedResult: "Size limit triggered",
  },

  // 11. Input Edge Cases
  {
    id: "11.1",
    category: "Input",
    name: "Huge Input",
    language: "python",
    stdin: "A".repeat(100000),
    code: `import sys\ndata = sys.stdin.read()\nprint(len(data))`,
    expectedResult: "Handled correctly",
  },
  {
    id: "11.2",
    category: "Input",
    name: "Empty Input",
    language: "python",
    stdin: "",
    code: `import sys\ndata = sys.stdin.read()\nprint(f"LEN:{len(data)}")`,
    expectedResult: "Handled correctly",
  },

  // 14.2 Namespace Inspection
  {
    id: "14.2",
    category: "Sandbox Escape",
    name: "Namespace Inspection",
    language: "python",
    code: `try: print(open("/proc/1/cgroup").read())\nexcept Exception as e: print(e)`,
    expectedResult: "Restricted",
  },
];

async function runTest(test: TestCase) {
  console.log(`\n[${test.id}] Running ${test.category}: ${test.name}...`);
  try {
    const start = Date.now();
    const result = await executeCode(test.language, test.code, test.stdin);
    const duration = Date.now() - start;

    const statusStr = result.code !== null ? `Exited (${result.code})` : `Signaled (${result.signal})`;
    console.log(`  - Status: ${statusStr}`);
    console.log(`  - Duration: ${duration}ms`);
    const snippet = result.output.slice(0, 150).replace(/\n/g, "\\n");
    console.log(`  - Output: ${snippet}${result.output.length > 150 ? "..." : ""}`);

    // Improved Validation Logic
    let passed = true;
    let reason = "Match";

    if (test.expectedSignal && result.signal !== test.expectedSignal) {
      // Allow mapping signal to exit code (e.g. 139 for SIGSEGV)
      const sigMap: Record<string, number> = { "SIGSEGV": 139, "SIGABRT": 134, "SIGKILL": 137 };
      if (sigMap[test.expectedSignal] !== result.code) {
        passed = false;
        reason = `Expected signal ${test.expectedSignal}, got ${result.signal || result.code}`;
      }
    }
    
    if (test.expectedCode !== undefined && result.code !== test.expectedCode) {
      if (test.expectedCode === 1 && result.code !== 1) { // Generic error
        passed = false;
        reason = `Expected exit code ${test.expectedCode}, got ${result.code}`;
      }
    }

    // Output checks for escapes
    if (test.id === "14.1" && result.output.includes("ALLOWED")) {
        passed = false;
        reason = "PTRACE was ALLOWED (Security Risk)";
    }
    if (test.id === "7.1" && result.output.includes("root:x:0:0")) {
        passed = false;
        reason = "System files are readable (Information Leak)";
    }

    return { ...test, result, duration, passed, reason };
  } catch (error: any) {
    console.error(`  - FAILED to execute: ${error.message}`);
    return { ...test, error: error.message, passed: false, reason: error.message };
  }
}

async function runConcurrencyTest(count: number) {
  console.log(`\n[12] Running Concurrency Test: ${count} simultaneous requests...`);
  const start = Date.now();
  const tasks = Array.from({ length: count }, (_, i) => 
    executeCode("python", `print(${i})`).catch((e: any) => ({ output: e.message }))
  );
  const results = await Promise.all(tasks);
  const duration = Date.now() - start;
  const success = results.filter((r: any) => r.output && r.output.trim().match(/^\d+$/)).length;
  console.log(`  - Completed ${count} requests in ${duration}ms`);
  console.log(`  - Success rate: ${success}/${count}`);
  return { id: "12", category: "Load", name: `Simultaneous (${count})`, passed: success === count, duration, reason: `${success}/${count} ok` };
}

async function main() {
  console.log("==============================================================");
  console.log("   MORATTU CODER - EXECUTION ENGINE SECURITY BENCHMARK        ");
  console.log("==============================================================");
  console.log(`Target: ${process.env.PISTON_API_URL}`);
  
  const results = [];
  for (const test of TEST_SUITE) {
    results.push(await runTest(test));
  }

  // Add load tests
  results.push(await runConcurrencyTest(10));
  results.push(await runConcurrencyTest(50));

  console.log("\n\n==============================================================");
  console.log("                       SUMMARY REPORT                         ");
  console.log("==============================================================");
  console.log("ID    | CATEGORY        | NAME                      | STATUS      | REASON");
  console.log("------|-----------------|---------------------------|-------------|-------");
  
  let passedCount = 0;
  results.forEach((r: any) => {
    const status = r.passed ? "✅ PASS" : "❌ FAIL";
    if (r.passed) passedCount++;
    console.log(`${r.id.padEnd(5)} | ${r.category.padEnd(15)} | ${r.name.padEnd(25)} | ${status.padEnd(11)} | ${r.reason || ""}`);
  });

  console.log("==============================================================");
  console.log(`TOTAL: ${passedCount}/${results.length} passed.`);
  console.log("==============================================================");
}

main().catch(console.error);
