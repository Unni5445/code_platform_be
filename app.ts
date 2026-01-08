import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import errorHandler from "./src/middlewares/errorHandler";
import { pageNotFound } from "./src/middlewares/pageNotFound";
import userRoute from "./src/routes/user.routes";
import studentRoute from "./src/routes/student.routes";
import collegeRoute from "./src/routes/college.routes";
import questionRoute from "./src/routes/question.routes";
import mocktestRoute from "./src/routes/mocktest.routes";
import mockTestSubmissionRoute from "./src/routes/mockTestSubmission.routes";


dotenv.config();

const app = express();

// Security Headers
app.use(helmet());

// Parse allowed origins from environment variable
const allowedOrigins = (process.env.ALLOWED_ORIGINS!).split(",");

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, 
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use(
  "/api/v1",
  userRoute,
  studentRoute,
  collegeRoute,
  questionRoute,
  mocktestRoute,
  mockTestSubmissionRoute
);
// Database Connection
mongoose
  .connect(process.env.MONGO_DB!,)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(() => console.log("MongoDB connection failed"));

// Error Handling
app.use(pageNotFound);
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5454;
app.listen(PORT, () => console.log(`Server running successfully on port ${PORT}`));
