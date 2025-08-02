import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createCustomer, deleteCustomer, getAllCustomers, getCustomerById, updateCustomer } from "../controllers/customer.controller.js";

const router = Router();

router.post("/create-customer", authMiddleware, createCustomer);
router.get("/get-customers", authMiddleware, getAllCustomers);
router.get("/get-customer/:id", authMiddleware, getCustomerById);
router.put("/update-customer/:id", authMiddleware, updateCustomer);
router.delete("/delete-customer/:id", authMiddleware, deleteCustomer);

export default router;
