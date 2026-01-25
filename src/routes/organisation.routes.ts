import express from "express";
import OrganisationController from "../controllers/organisation.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

/**
 * ================= ORGANISATION CRUD
 */

// Create organisation (SUPER_ADMIN only)
router.post(
  "/organisations",
  protect,
  authorize("SUPER_ADMIN"),
  OrganisationController.createOrganisation
);

// Get all organisations (ADMIN, SUPER_ADMIN)
router.get(
  "/organisations",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  OrganisationController.getAllOrganisations
);

// Get organisation by ID (any authenticated user)
router.get(
  "/organisations/:id",
  protect,
  OrganisationController.getOrganisationById
);

// Update organisation (SUPER_ADMIN only)
router.put(
  "/organisations/:id",
  protect,
  authorize("SUPER_ADMIN"),
  OrganisationController.updateOrganisation
);

// Delete organisation (SUPER_ADMIN only)
router.delete(
  "/organisations/:id",
  protect,
  authorize("SUPER_ADMIN"),
  OrganisationController.deleteOrganisation
);

/**
 * ================= ORGANISATION ADMINS
 */

// Add admin to organisation
router.post(
  "/organisations/admin/add",
  protect,
  authorize("SUPER_ADMIN"),
  OrganisationController.addAdminToOrganisation
);

// Remove admin from organisation
router.post(
  "/organisations/admin/remove",
  protect,
  authorize("SUPER_ADMIN"),
  OrganisationController.removeAdminFromOrganisation
);

export default router;
