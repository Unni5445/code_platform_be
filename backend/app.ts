import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import errorHandler from "./src/middlewares/errorHandler";
import { pageNotFound } from "./src/middlewares/pageNotFound";
import userRoute from "./src/routes/user.routes";
import courseRoute from "./src/routes/course.routes";
import testRoute from "./src/routes/test.routes";
import questionRoute from "./src/routes/question.routes";
import certificateRoute from "./src/routes/certificate.routes";
import batchRoute from "./src/routes/batch.routes";
import organisationRoute from "./src/routes/organisation.routes";
import dashboardRoute from "./src/routes/dashboard.routes";
import moduleRoute from "./src/routes/module.routes";
import submoduleRoute from "./src/routes/submodule.routes";
import enrollmentRoute from "./src/routes/enrollment.routes";
import studentRoute from "./src/routes/student.routes";
import { apiKeyProtect } from "./src/middlewares/apiKeyProtect";


dotenv.config();

const app = express();

// Security Headers
app.use(helmet());

// Parse allowed origins from environment variable
const allowedOrigins = (process.env.ALLOWED_ORIGINS||"").split(",");

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

// API Key Protection
app.use("/api/v1", apiKeyProtect);

// Routes
app.use("/api/v1", userRoute);
app.use("/api/v1", courseRoute);
app.use("/api/v1", testRoute);
app.use("/api/v1", questionRoute);
app.use("/api/v1", certificateRoute);
app.use("/api/v1", batchRoute);
app.use("/api/v1", organisationRoute);
app.use("/api/v1", dashboardRoute);
app.use("/api/v1", moduleRoute);
app.use("/api/v1", submoduleRoute);
app.use("/api/v1", enrollmentRoute);
app.use("/api/v1", studentRoute);
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
