import express from "express";
import SubmoduleController from "../controllers/submodule.controller";
import { protect, authorize } from "../middlewares/authProtect";
import upload from "../middlewares/upload";

const router = express.Router();

router
  .route("/submodules")
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"),upload.single('pdf') ,SubmoduleController.createSubmodule);

router.get(
  "/modules/:moduleId/submodules",
  protect,
  SubmoduleController.getSubmodulesByModule
);

router.put(
  "/submodules/reorder",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  SubmoduleController.reorderSubmodules
);

router
  .route("/submodules/:id")
  .get(protect, SubmoduleController.getSubmoduleById)
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"),upload.single('pdf'), SubmoduleController.updateSubmodule)
  .delete(protect, authorize("SUPER_ADMIN"), SubmoduleController.deleteSubmodule);

export default router;
