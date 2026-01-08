interface MCQQuestion {
  correctOptionIndex: number;
  marks: number;
}

interface TestCase {
  input: string;
  output: string;
}

export function evaluateMCQ(
  question: MCQQuestion,
  selectedOptionIndex: number
): number {
  return question.correctOptionIndex === selectedOptionIndex
    ? question.marks
    : 0;
}

export function evaluateCoding(
  testCases: TestCase[],
  userOutputs: string[]
): boolean {
  if (testCases.length !== userOutputs.length) {
    return false;
  }

  for (let i = 0; i < testCases.length; i++) {
    if (testCases[i].output.trim() !== userOutputs[i].trim()) {
      return false;
    }
  }

  return true;
}

export function evaluateCodingWithScore(
  testCases: TestCase[],
  userOutputs: string[],
  marks: number
): number {
  let passed = 0;

  testCases.forEach((tc, i) => {
    if (tc.output.trim() === userOutputs[i]?.trim()) {
      passed++;
    }
  });

  return Math.floor((passed / testCases.length) * marks);
}
