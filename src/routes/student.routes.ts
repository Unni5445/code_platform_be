import express from "express";
import StudentController from "../controllers/student.controller";
import { protect, studentProtect } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/students")
  .get(StudentController.getAllStudent)
  .post(StudentController.createStudent);
router
  .route("/students/:id")
  .get(StudentController.getStudent)
  .put(StudentController.updateStudent)
  .delete(StudentController.deleteStudent);
  
router.route("/studuent/sign-in").post(StudentController.signinStudent);
router.route("/studuent/sign-out").post(StudentController.signOut);
router.route("/get-student").post(studentProtect, StudentController.getStudentByToken);

export default router;
