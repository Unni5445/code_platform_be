import express from "express";
import OrganisationController from "../controllers/organisation.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/organisations")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), OrganisationController.getOrganisations)
  .post(protect, authorize("SUPER_ADMIN"), OrganisationController.createOrganisation);

router
  .route("/organisations/:id")
  .get(protect, OrganisationController.getOrganisationById)
  .put(protect, authorize("SUPER_ADMIN"), OrganisationController.updateOrganisation)
  .delete(protect, authorize("SUPER_ADMIN"), OrganisationController.deleteOrganisation);

export default router;
