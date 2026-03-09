import express from "express";
import BatchController from "../controllers/batch.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/batches")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), BatchController.getBatches)
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), BatchController.createBatch);

router
  .route("/batches/:id")
  .get(protect, BatchController.getBatchById)
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"), BatchController.updateBatch)
  .delete(protect, authorize("SUPER_ADMIN"), BatchController.deleteBatch);

// Batch operations (batch delete and update)
router.delete(
  "/batches",
  protect,
  authorize("SUPER_ADMIN"),
  BatchController.deleteBatches
);

router.put(
  "/batches",
  protect,
  authorize("SUPER_ADMIN"),
  BatchController.updateBatches
);

export default router;
