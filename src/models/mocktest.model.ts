import mongoose from "mongoose";

const mockTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    instructions: {
      type: String,
    },

    duration: {
      type: Number, // in minutes
      required: true,
    },

    totalMarks: {
      type: Number,
      required: true,
    },

    questions: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        marks: {
          type: Number,
          required: true,
        },
      },
    ],

    isPublished: {
      type: Boolean,
      default: false,
    },

    startTime: {
      type: Date,
    },

    endTime: {
      type: Date,
    },

    allowedAttempts: {
      type: Number,
      default: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted:{
        type: Boolean,
        default :false
    }
  },
  {
    timestamps : true
  }
);

const MockTest = mongoose.model("MockTest", mockTestSchema);

export default MockTest;
