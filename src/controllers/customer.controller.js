import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from "validator";

import {
  hashPassword,
  formattedJoinDate,
} from "../utils/utils.js";
import prisma from "../db/db.js";

const createCustomer = asyncHandler(async (req, res) => {
  const { name, location, status, joinDate, email, phone, password } = req.body;
  const { role } = req.user;

  if (
    !name ||
    !location ||
    !status ||
    !joinDate ||
    !email ||
    !phone ||
    !password
  ) {
    return ApiError.send(res, 400, "All fields are required.");
  }

  if (role !== "Admin") {
    return ApiError.send(res, 403, "Only Admins can create a customer.");
  }

  if (!email || !password) {
    return ApiError.send(res, 400, "Email and password are required.");
  }

  if (!validator.isEmail(email)) {
    return ApiError.send(res, 400, "Invalid email format.");
  }

  if (!validator.isStrongPassword(password)) {
    return ApiError.send(
      res,
      400,
      "Password must be at least 8 characters long and include letters, numbers, and symbols.",
    );
  }

  if (phone && !validator.isMobilePhone(phone, "any")) {
    return ApiError.send(res, 400, "Invalid mobile number.");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(phone ? [{ phone }] : [])],
    },
  });

  if (existingUser) {
    return ApiError.send(
      res,
      400,
      "User already exists with the given email or phone number.",
    );
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone.trim(),
      location,
      status,
      joinDate: joinDate ? new Date(joinDate) : undefined, // Converts to ISO Date
    },
  });

  const { password: _, ...userSafe } = newUser;

  const formattedDate = formattedJoinDate(newUser.joinDate); // ✅ Fixed typo

  const userSafeWithFormattedDate = {
    ...userSafe,
    joinDate: formattedDate,
  };

  return res.status(201).json(
    new ApiResponse(201, "Customer created successfully.", {
      user: userSafeWithFormattedDate,
    }),
  );
});

const getAllCustomers = asyncHandler(async (req, res) => {
  if (req.user.role !== "Admin") {
    return ApiError.send(res, 403, "Only Admins can view customers.");
  }

  const customers = await prisma.user.findMany({
    where: { role: "Customer" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      location: true,
      status: true,
      joinDate: true,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Customers retrieved successfully.", customers));
});

const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== "Admin") {
    return ApiError.send(res, 403, "Only admins can fetch categories.");
  }

  const customer = await prisma.user.findUnique({
    where: { id },
  });

  if (!customer || customer.role !== "Customer") {
    return ApiError.send(res, 404, "Customer not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Customer retrieved successfully.", customer));
});

const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  const { name, email, phone, location, status } = req.body;

  if (role !== "Admin") {
    return ApiError.send(res, 403, "Only Admins can update a customer.");
  }

  const customer = await prisma.user.findUnique({ where: { id } });

  if (!customer || customer.role !== "Customer") {
    return ApiError.send(res, 404, "Customer not found.");
  }

  const updateData = {};

  if (name) updateData.name = name.trim();
  if (email) updateData.email = email.trim().toLowerCase();
  if (phone) updateData.phone = phone.trim();
  if (location) updateData.location = location.trim();
  if (status) updateData.status = status.trim();

  if (Object.keys(updateData).length === 0) {
    return ApiError.send(
      res,
      400,
      "Please provide at least one field to update.",
    );
  }

  const updatedCustomer = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Customer updated successfully.", updatedCustomer),
    );
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== "Admin") {
    return ApiError.send(res, 403, "Only Admins can delete a customer.");
  }

  const customer = await prisma.user.findUnique({ where: { id } });

  if (!customer || customer.role !== "Customer") {
    return ApiError.send(res, 404, "Customer not found.");
  }

  // Step 1: Delete customer orders and their related order items
  const customerOrders = await prisma.order.findMany({
    where: { customerid: id },
    select: { id: true },
  });

  const orderIds = customerOrders.map((order) => order.id);

  if (orderIds.length > 0) {
    await prisma.orderItem.deleteMany({
      where: { orderid: { in: orderIds } },
    });

    await prisma.order.deleteMany({
      where: { id: { in: orderIds } },
    });
  }

  // Step 2: Delete records created by the user (Category, Product, Order)
  await prisma.category.deleteMany({ where: { createdby: id } });
  await prisma.product.deleteMany({ where: { createdby: id } });
  await prisma.order.deleteMany({ where: { createdby: id } });

  // Step 3: Finally, delete the user
  await prisma.user.delete({ where: { id } });

  return res
    .status(200)
    .json(new ApiResponse(200, "Customer deleted successfully."));
});

export {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
