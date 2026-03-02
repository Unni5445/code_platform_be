import express from "express";
import CourseController from "../controllers/course.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/courses")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), CourseController.getCourses)
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), CourseController.createCourse);

router
  .route("/courses/:id")
  .get(protect, CourseController.getCourseById)
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"), CourseController.updateCourse)
  .delete(protect, authorize("SUPER_ADMIN"), CourseController.deleteCourse);

router.post(
  "/courses/:id/enroll",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  CourseController.enrollStudents
);

export default router;
