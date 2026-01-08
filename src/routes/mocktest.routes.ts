import express from "express";
import MockTestController from "../controllers/moctTest.controller";
import { protect } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/mock-tests")
  .get(MockTestController.getAllMockTest)
  .post(MockTestController.createMockTest);
router
  .route("/mock-tests/:id")
  .get(MockTestController.getMockTest)
  .put(MockTestController.updateMockTest)
  .delete(MockTestController.deleteMockTest);

export default router;
