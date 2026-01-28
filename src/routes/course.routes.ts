import express from "express";
import CourseController from "../controllers/course.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

/**
 * ================= COURSE CRUD
 */

// Create course (ADMIN, SUPER_ADMIN)
router.post(
  "/courses",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  CourseController.createCourse
);

// Get all courses (any authenticated user)
router.get(
  "/courses",
  protect,
  CourseController.getAllCourses
);

// Get course by ID (any authenticated user)
router.get(
  "/courses/:id",
  protect,
  CourseController.getCourseById
);

// Update course (ADMIN, SUPER_ADMIN)
router.put(
  "/courses/:id",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  CourseController.updateCourse
);

// Delete course (ADMIN, SUPER_ADMIN)
router.delete(
  "/courses/:id",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  CourseController.deleteCourse
);

export default router;