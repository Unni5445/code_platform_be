import express, { Request, Response } from "express";
import path from "path";
import { promises as fsPromises } from "fs";
import { protect } from "../middlewares/authProtect";

const router = express.Router();

// GET /uploads/pdfs/:filename
// Only authenticated users can access PDF files
router.get("/uploads/pdfs/:filename", protect, async (req: Request, res: Response) => {
  const { filename } = req.params;
  const safeName = path.basename(filename);
  const filePath = path.join(process.cwd(), "public", "uploads", "pdfs", safeName);

  try {
    await fsPromises.access(filePath); // Throws if file doesn't exist
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(404).json({ message: "File not found" });
  }
});
export default router;