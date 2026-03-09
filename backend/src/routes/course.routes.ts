import express from "express";
import CourseController from "../controllers/course.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/courses")
  .get(protect, CourseController.getCourses)
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), CourseController.createCourse);

router
  .route("/courses/:id")
  .get(protect, CourseController.getCourseById)
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"), CourseController.updateCourse)
  .delete(protect, authorize("SUPER_ADMIN"), CourseController.deleteCourse);

export default router;
