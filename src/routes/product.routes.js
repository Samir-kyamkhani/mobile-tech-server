import upload from "../middlewares/multer.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../controllers/product.controller.js";

const router = Router();

router.post(
  "/create-product",
  authMiddleware,
  upload.array("images", 5),
  createProduct,
);
router.get("/get-products", getAllProducts);
router.get("/get-product/:id", getProductById);
router.put(
  "/update-product/:id",
  authMiddleware,
  upload.array("images", 5),
  updateProduct,
);
router.delete("/delete-product/:id", authMiddleware, deleteProduct);

export default router;
