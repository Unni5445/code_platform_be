import mongoose from "mongoose";

const mockTestSubmissionSchema = new mongoose.Schema({
  mockTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MockTest",
    required: true,
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },

  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },

      // For MCQ
      selectedOptionIndexs: [Number],

      // For Coding
      code: String,
      language: String,

      marksObtained: {
        type: Number,
        default: 0,
      },
    },
  ],

  totalScore: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    enum: ["in-progress", "submitted", "evaluated"],
    default: "in-progress",
  },

  startedAt: {
    type: Date,
    default: Date.now,
  },

  submittedAt: {
    type: Date,
  },
  
  isDeleted:{
    type: Boolean,
    default :false
  }
});

const MockTestSubmission = mongoose.model(
  "MockTestSubmission",
  mockTestSubmissionSchema
);

export default MockTestSubmission;
