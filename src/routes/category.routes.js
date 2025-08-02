import { Router } from "express";
import upload from "../middlewares/multer.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.post(
  "/create-category",
  authMiddleware,
  upload.single("image"),
  createCategory,
);
router.get("/get-categories",  getAllCategories);
router.get("/get-category/:id", authMiddleware, getCategoryById);
router.put(
  "/update-category/:id",
  authMiddleware,
  upload.single("image"),
  updateCategory,
);

router.delete("/delete-category/:id", authMiddleware, deleteCategory);

export default router;
