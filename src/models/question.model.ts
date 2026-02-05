import mongoose from "mongoose";

/**
 * Question Types:
 * - single_choice_mcq: Multiple choice question with only one correct answer
 * - multi_choice_mcq: Multiple choice question with multiple correct answers
 * - coding: Programming question with code stubs and test cases
 */
export type QuestionType = "single_choice_mcq" | "multi_choice_mcq" | "coding";

export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Interface for MCQ Option
 */
export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

/**
 * Interface for Coding Test Case
 */
export interface CodingTestCase {
  input: string;
  output: string;
  isHidden: boolean;
  explanation?: string;
}

/**
 * Interface for Code Stub (language-specific starter code)
 */
export interface CodeStub {
  language: string;
  code: string;
  functionName?: string;
  className?: string;
}

/**
 * Interface for Example (LeetCode style)
 */
export interface ProblemExample {
  id: number;
  input: string;
  output: string;
  explanation?: string;
}

/**
 * Interface for Problem Hints
 */
export interface ProblemHint {
  id: number;
  hint: string;
}

/**
 * Interface for Similar Problem Reference
 */
export interface SimilarProblem {
  problemId: mongoose.Types.ObjectId;
  title: string;
  difficulty: DifficultyLevel;
}

/**
 * Interface for Company Tag
 */
export interface CompanyTag {
  name: string;
  frequency: number; // How often this problem appears in interviews
}

/**
 * Main Question Document Interface
 */
export interface IQuestion extends mongoose.Document {
  // Common fields
  title: string;
  problemNumber?: number; // LeetCode-style problem number (e.g., "1" for "1. Two Sum")
  problemSlug?: string; // URL-friendly slug (e.g., "two-sum")
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  course: mongoose.Types.ObjectId;
  
  // Problem Content (LeetCode style)
  description: string; // Rich text problem description
  examples?: ProblemExample[];
  constraints?: string[];
  followUp?: string; // Follow-up question
  
  // Topics/Tags (e.g., Array, Dynamic Programming, Tree)
  topics?: string[];
  
  // Companies (e.g., Google, Amazon, Microsoft)
  companies?: CompanyTag[];
  
  // MCQ fields (for single_choice_mcq and multi_choice_mcq)
  options?: MCQOption[];
  correctOption?: number[];
  
  // Coding fields
  inputFormat?: string;
  outputFormat?: string;
  testCases?: CodingTestCase[];
  codeStubs?: CodeStub[];
  allowedLanguages?: string[];
  timeLimit?: number;
  memoryLimit?: number;
  
  // Hints for users
  hints?: ProblemHint[];
  
  // Editorial/Solution
  editorial?: string;
  
  // Similar problems
  similarProblems?: SimilarProblem[];
  
  // Statistics
  acceptanceRate?: number; // Percentage
  submissionsCount?: number;
  acceptedCount?: number;
  discussionCount?: number;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  isPremium?: boolean; // Premium problems
  isLocked?: boolean; // Locked for certain users
}

const questionSchema = new mongoose.Schema<IQuestion>(
  {
    // ===== COMMON FIELDS =====
    title: {
      type: String,
      required: [true, "Question title is required"],
      trim: true,
      maxlength: [500, "Question title cannot exceed 500 characters"],
    },

    problemNumber: {
      type: Number,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
      min: [1, "Problem number must be at least 1"],
    },

    problemSlug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Problem slug can only contain lowercase letters, numbers, and hyphens"],
    },

    type: {
      type: String,
      enum: ["single_choice_mcq", "multi_choice_mcq", "coding"],
      required: [true, "Question type is required"],
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
      required: true,
    },

    marks: {
      type: Number,
      default: 1,
      min: [0, "Marks cannot be negative"],
      max: [100, "Marks cannot exceed 100"],
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      // required: [true, "Course association is required"],
      index: true,
    },

    // ===== PROBLEM CONTENT (LeetCode Style) =====
    description: {
      type: String,
      required: [true, "Problem description is required"],
      trim: true,
    },

    examples: {
      type: [
        {
          id: {
            type: Number,
            required: true,
          },
          input: {
            type: String,
            required: true,
          },
          output: {
            type: String,
            required: true,
          },
          explanation: {
            type: String,
          },
        },
      ],
      validate: {
        validator: function(this: IQuestion, examples: ProblemExample[]) {
          // Only validate if this is a coding question
          if (this.type !== "coding") {
            return true;
          }
          // Coding questions should have at least 1 example
          return examples && examples.length >= 1;
        },
        message: "Coding questions should have at least 1 example",
      },
    },

    constraints: {
      type: [String],
      default: [],
    },

    followUp: {
      type: String,
      trim: true,
    },

    // ===== TOPICS/TAGS =====
    topics: {
      type: [String],
      default: [],
      enum: {
        values: [
          "Array", "String", "Hash Table", "Linked List", "Tree", "Graph",
          "Dynamic Programming", "Backtracking", "Greedy", "Binary Search",
          "Sorting", "Recursion", "Math", "Bit Manipulation", "Stack",
          "Queue", "Heap", "Trie", "Divide and Conquer", "Breadth-First Search",
          "Depth-First Search", "Binary Tree", "Binary Search Tree", "Matrix",
          "Two Pointers", "Sliding Window", "Prefix Sum", "Union Find",
          "Topological Sort", "Segment Tree", "Binary Indexed Tree",
          "Geometry", "Randomized", "Rejection Sampling", "Reservoir Sampling",
          "Design", "Data Stream", "Ordered Set", "Brainteaser", "Memoization"
        ],
        message: "Invalid topic specified",
      },
    },

    // ===== COMPANIES =====
    companies: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          frequency: {
            type: Number,
            default: 1,
            min: [1, "Frequency must be at least 1"],
          },
        },
      ],
      default: [],
    },

    // ===== MCQ FIELDS =====
    options: {
      type: [
        {
          text: {
            type: String,
            required: true,
            trim: true,
          },
          isCorrect: {
            type: Boolean,
            default: false,
          },
        },
      ],
      validate: {
        validator: function(this: IQuestion, options: MCQOption[]) {
          // Only validate options if this is an MCQ type
          if (this.type === "coding") {
            return true; // Skip validation for coding questions
          }
          // MCQ questions must have at least 2 options
          return options && options.length >= 2;
        },
        message: "MCQ questions must have at least 2 options",
      },
    },

    correctOption: {
      type: [Number],
      validate: {
        validator: function(this: IQuestion, correctOption: number[]) {
          // Only validate if this is an MCQ type
          if (this.type === "coding") {
            return true; // Skip validation for coding questions
          }
          
          const options = this.options || [];
          
          // Single choice MCQ must have exactly 1 correct option
          if (this.type === "single_choice_mcq") {
            return correctOption && correctOption.length === 1;
          }
          
          // Multi choice MCQ must have at least 1 correct option
          if (this.type === "multi_choice_mcq") {
            return correctOption && correctOption.length >= 1;
          }
          
          return true;
        },
        message: function(this: IQuestion) {
          if (this.type === "single_choice_mcq") {
            return "Single choice MCQ must have exactly 1 correct option";
          }
          return "Multi choice MCQ must have at least 1 correct option";
        },
      },
    },

    // ===== CODING FIELDS =====
    inputFormat: {
      type: String,
      trim: true,
    },

    outputFormat: {
      type: String,
      trim: true,
    },

    testCases: {
      type: [
        {
          input: {
            type: String,
            required: true,
          },
          output: {
            type: String,
            required: true,
          },
          isHidden: {
            type: Boolean,
            default: true,
          },
          explanation: {
            type: String,
          },
        },
      ],
      validate: {
        validator: function(this: IQuestion, testCases: CodingTestCase[]) {
          // Only validate if this is a coding question
          if (this.type !== "coding") {
            return true; // Skip validation for MCQ questions
          }
          // Coding questions must have at least 1 test case
          return testCases && testCases.length >= 1;
        },
        message: "Coding questions must have at least 1 test case",
      },
    },

    codeStubs: {
      type: [
        {
          language: {
            type: String,
            required: true,
            trim: true,
          },
          code: {
            type: String,
            required: true,
          },
          functionName: {
            type: String,
          },
          className: {
            type: String,
          },
        },
      ],
    },

    allowedLanguages: {
      type: [String],
      default: ["python", "java", "c", "cpp", "javascript", "typescript"],
      validate: {
        validator: function(languages: string[]) {
          const validLanguages = [
            "python", "java", "c", "cpp", "javascript", "typescript",
            "go", "rust", "ruby", "php", "swift", "kotlin"
          ];
          return languages.every(lang => validLanguages.includes(lang));
        },
        message: "Invalid programming language specified",
      },
    },

    timeLimit: {
      type: Number, // in seconds
      default: 2,
      min: [1, "Time limit must be at least 1 second"],
      max: [300, "Time limit cannot exceed 300 seconds (5 minutes)"],
    },

    memoryLimit: {
      type: Number, // in MB
      min: [64, "Memory limit must be at least 64 MB"],
      max: [4096, "Memory limit cannot exceed 4096 MB (4 GB)"],
    },

    // ===== HINTS =====
    hints: {
      type: [
        {
          id: {
            type: Number,
            required: true,
          },
          hint: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
    },

    // ===== EDITORIAL =====
    editorial: {
      type: String,
      trim: true,
    },

    // ===== SIMILAR PROBLEMS =====
    similarProblems: {
      type: [
        {
          problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
            required: true,
          },
          title: {
            type: String,
            required: true,
          },
          difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            required: true,
          },
        },
      ],
      default: [],
    },

    // ===== STATISTICS =====
    acceptanceRate: {
      type: Number, // Percentage
      min: [0, "Acceptance rate cannot be negative"],
      max: [100, "Acceptance rate cannot exceed 100"],
      default: 0,
    },

    submissionsCount: {
      type: Number,
      min: [0, "Submissions count cannot be negative"],
      default: 0,
    },

    acceptedCount: {
      type: Number,
      min: [0, "Accepted count cannot be negative"],
      default: 0,
    },

    discussionCount: {
      type: Number,
      min: [0, "Discussion count cannot be negative"],
      default: 0,
    },

    // ===== METADATA =====
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
questionSchema.index({ course: 1, type: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ type: 1, difficulty: 1 });
questionSchema.index({ problemNumber: 1 }, { unique: true, sparse: true });
questionSchema.index({ problemSlug: 1 }, { unique: true, sparse: true });
questionSchema.index({ topics: 1 });
questionSchema.index({ "companies.name": 1 });
questionSchema.index({ difficulty: 1, acceptanceRate: -1 });
questionSchema.index({ submissionsCount: -1 });

// Pre-save middleware to ensure type-specific field consistency
questionSchema.pre("save", function(next) {
  const question = this as IQuestion;
  
  // Generate problemSlug from title if not provided
  if (!question.problemSlug && question.title) {
    question.problemSlug = question.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // For MCQ types, ensure options array exists and is properly formatted
  if (question.type === "single_choice_mcq" || question.type === "multi_choice_mcq") {
    if (!question.options || question.options.length === 0) {
      return next(new Error("MCQ questions must have at least 2 options"));
    }
    
    // Ensure isCorrect flags match correctOption array
    if (question.correctOption && question.options) {
      question.options.forEach((opt, index) => {
        opt.isCorrect = question.correctOption!.includes(index);
      });
    }
  }
  
  // For coding type, ensure test cases exist
  if (question.type === "coding") {
    if (!question.testCases || question.testCases.length === 0) {
      return next(new Error("Coding questions must have at least 1 test case"));
    }
  }
  
  next();
});

// Instance method to check if question is MCQ
questionSchema.methods.isMCQ = function(): boolean {
  return this.type === "single_choice_mcq" || this.type === "multi_choice_mcq";
};

// Instance method to check if question is Coding
questionSchema.methods.isCoding = function(): boolean {
  return this.type === "coding";
};

// Static method to get questions by course
questionSchema.statics.getByCourse = function(courseId: mongoose.Types.ObjectId) {
  return this.find({ course: courseId, isDeleted: false });
};

// Static method to get questions by type
questionSchema.statics.getByType = function(type: QuestionType) {
  return this.find({ type, isDeleted: false });
};

// Static method to get questions by difficulty
questionSchema.statics.getByDifficulty = function(difficulty: DifficultyLevel) {
  return this.find({ difficulty, isDeleted: false });
};

// Static method to get questions by topic
questionSchema.statics.getByTopic = function(topic: string) {
  return this.find({ topics: topic, isDeleted: false });
};

// Static method to get questions by company
questionSchema.statics.getByCompany = function(companyName: string) {
  return this.find({ "companies.name": companyName, isDeleted: false });
};

// Static method to get question by slug
questionSchema.statics.getBySlug = function(slug: string) {
  return this.findOne({ problemSlug: slug, isDeleted: false });
};

// Static method to search questions by title
questionSchema.statics.searchByTitle = function(searchTerm: string) {
  return this.find({
    title: { $regex: searchTerm, $options: 'i' },
    isDeleted: false
  });
};

// Static method to get popular questions (by submissions)
questionSchema.statics.getPopular = function(limit: number = 10) {
  return this.find({ isDeleted: false })
    .sort({ submissionsCount: -1 })
    .limit(limit);
};

// Static method to get questions sorted by acceptance rate
questionSchema.statics.getByAcceptanceRate = function(ascending: boolean = true) {
  return this.find({ isDeleted: false })
    .sort({ acceptanceRate: ascending ? 1 : -1 });
};

const Question = mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
