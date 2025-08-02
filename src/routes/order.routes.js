import { Router } from "express";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-order", authMiddleware, createOrder);
router.get("/get-orders", authMiddleware, getAllOrders);
router.get("/get-order/:id", authMiddleware, getOrderById);
router.put("/update-order/:id", authMiddleware, updateOrder);
router.delete("/delete-order/:id", authMiddleware, deleteOrder);

export default router;
