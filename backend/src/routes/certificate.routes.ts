import express from "express";
import CertificateController from "../controllers/certificate.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/certificates")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), CertificateController.getCertificates)
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), CertificateController.createCertificate);

router
  .route("/certificates/:id")
  .get(protect, CertificateController.getCertificateById)
  .delete(protect, authorize("SUPER_ADMIN"), CertificateController.deleteCertificate);

// Public verification endpoint
router.get("/certificates/verify/:verificationId", CertificateController.verifyCertificate);

export default router;
