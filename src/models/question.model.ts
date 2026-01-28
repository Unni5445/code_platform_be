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
}

/**
 * Interface for Code Stub (language-specific starter code)
 */
export interface CodeStub {
  language: string;
  code: string;
}

/**
 * Main Question Document Interface
 */
export interface IQuestion extends mongoose.Document {
  // Common fields
  title: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  course: mongoose.Types.ObjectId;
  
  // MCQ fields (for single_choice_mcq and multi_choice_mcq)
  options?: MCQOption[];
  correctOption?: number[];
  
  // Coding fields
  description?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  testCases?: CodingTestCase[];
  codeStubs?: CodeStub[];
  allowedLanguages?: string[];
  timeLimit?: number;
  memoryLimit?: number;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
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
      required: [true, "Course association is required"],
      index: true,
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
    description: {
      type: String,
      trim: true,
    },

    inputFormat: {
      type: String,
      trim: true,
    },

    outputFormat: {
      type: String,
      trim: true,
    },

    constraints: {
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

    // ===== METADATA =====
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: {
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

// Pre-save middleware to ensure type-specific field consistency
questionSchema.pre("save", function(next) {
  const question = this as IQuestion;
  
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

const Question = mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
