import express from "express";
import CollegeController from "../controllers/college.controller";
import { protect } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/colleges")
  .get(CollegeController.getAllCollege)
  .post(CollegeController.createCollege);
router
  .route("/colleges/:id")
  .get(CollegeController.getCollege)
  .put(CollegeController.updateCollege)
  .delete(CollegeController.deleteCollege);

export default router;
