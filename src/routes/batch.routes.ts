import express from "express";
import BatchController from "../controllers/batch.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

/**
 * ================= BATCH CRUD
 */

// Create batch (ADMIN, SUPER_ADMIN)
router.post(
  "/batches",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  BatchController.createBatch
);

// Get all batches (any authenticated user)
router.get(
  "/batches",
  protect,
  BatchController.getAllBatches
);

// Get batch by ID (any authenticated user)
router.get(
  "/batches/:id",
  protect,
  BatchController.getBatchById
);

// Update batch (ADMIN, SUPER_ADMIN)
router.put(
  "/batches/:id",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  BatchController.updateBatch
);

// Delete batch (ADMIN, SUPER_ADMIN)
router.delete(
  "/batches/:id",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  BatchController.deleteBatch
);

/**
 * ================= BATCH STUDENTS
 */

// Add student to batch
router.post(
  "/batches/student/add",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  BatchController.addStudentToBatch
);

// Remove student from batch
router.post(
  "/batches/student/remove",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  BatchController.removeStudentFromBatch
);

export default router;