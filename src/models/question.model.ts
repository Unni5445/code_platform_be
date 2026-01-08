import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["mcq", "coding"],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },

    marks: {
      type: Number,
      default: 1,
    },

    // ===== MCQ FIELDS =====
    options: [
      {
        text: String,
        isCorrect: Boolean,
      },
    ],

    multiSelect : {
      type: Boolean,
    },

    correctOption: {
      type: [Number],
    },

    // ===== CODING FIELDS =====
    description: String,

    inputFormat: String,
    outputFormat: String,

    constraints: String,

    testCases: [
      {
        input: String,
        output: String,
        isHidden: {
          type: Boolean,
          default: true,
        },
      },
    ],

    allowedLanguages: {
      type: [String],
      default: ["python", "java", "c", "cpp", "javascript", "typescript"],
    },

    timeLimit: {
      type: Number, // in seconds
      default: 2,
    },

    memoryLimit: {
      type: Number, // in MB
    },

    // ===== COMMON =====
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted:{
        type: Boolean,
        default: false
    }
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
