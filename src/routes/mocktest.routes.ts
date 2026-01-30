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

// Get mock tests by batch ID
router.get("/mock-tests/batch/:batchId", MockTestController.getMockTestsByBatch);

// Get mock tests by course ID
router.get("/mock-tests/course/:courseId", MockTestController.getMockTestsByCourse);

// Get mock tests by test type (general, batch, course)
router.get("/mock-tests/type/:testType", MockTestController.getMockTestsByType);

// Get mock tests for dropdown
router.get("/mock-tests/dropdown", MockTestController.getAllMockTestsForDropdown);

export default router;
