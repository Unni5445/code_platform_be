import express from "express";
import EnrollmentController from "../controllers/enrollment.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

// Admin: enroll students into a course
router.post(
  "/courses/:courseId/enroll",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  EnrollmentController.enrollStudents
);

// Admin: list enrollments for a course
router.get(
  "/courses/:courseId/enrollments",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  EnrollmentController.getEnrollmentsByCourse
);

// Admin: get specific student's enrollment in a course
router.get(
  "/courses/:courseId/enrollments/:studentId",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  EnrollmentController.getEnrollment
);

// Admin: update enrollment status or remove
router
  .route("/enrollments/:id")
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"), EnrollmentController.updateEnrollmentStatus)
  .delete(protect, authorize("SUPER_ADMIN"), EnrollmentController.removeEnrollment);

// Student: get own enrollments
router.get(
  "/my/enrollments",
  protect,
  EnrollmentController.getMyEnrollments
);

export default router;
