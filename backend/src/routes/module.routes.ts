import express from "express";
import ModuleController from "../controllers/module.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/modules")
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), ModuleController.createModule);

router.get(
  "/courses/:courseId/modules",
  protect,
  ModuleController.getModulesByCourse
);

router.put(
  "/modules/reorder",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  ModuleController.reorderModules
);

router
  .route("/modules/:id")
  .get(protect, ModuleController.getModuleById)
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"), ModuleController.updateModule)
  .delete(protect, authorize("SUPER_ADMIN"), ModuleController.deleteModule);

export default router;
