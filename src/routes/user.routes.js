import { Router } from "express";
import {
  forgotPassword,
  getAllUsers,
  login,
  logout,
  resetPassword,
  updateAdmin,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/update-admin", authMiddleware, updateAdmin);
router.get("/get-users", authMiddleware, getAllUsers);
router.post("/logout", authMiddleware, logout);
router.post("/forgot-password", authMiddleware, forgotPassword);
router.post("/reset-password", authMiddleware, resetPassword);

export default router;
