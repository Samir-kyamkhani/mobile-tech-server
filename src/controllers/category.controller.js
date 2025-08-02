import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOldImage } from "../utils/utils.js";

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new category
const createCategory = asyncHandler(async (req, res) => {
  const { name, sku, description } = req.body;
  const { id, role } = req.user;

  if (role !== "Admin") {
    return ApiError.send(res, 403, "Only admins can create a category.");
  }

  if (!name?.trim() || !sku?.trim() || !description?.trim()) {
    return ApiError.send(
      res,
      400,
      "All fields (name, SKU, description) are required.",
    );
  }

  const existingCategory = await prisma.category.findUnique({ where: { sku } });
  if (existingCategory) {
    return ApiError.send(res, 409, "SKU already exists.");
  }

  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      sku: sku.trim(),
      description: description.trim(),
      image,
      createdby: id,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Category created successfully", { category }));
});

// Get all categories
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { creator: true, products: true },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Categories fetched", { categories }));
});

// Get category by ID
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== "Admin") {
    return ApiError.send(res, 403, "Only admins can fetch a category.");
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: { creator: true, products: true },
  });

  if (!category) {
    return ApiError.send(res, 404, "Category not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Category fetched successfully", { category }));
});

// Update category
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, sku, description } = req.body;

  if (req.user.role !== "Admin") {
    return ApiError.send(res, 403, "Only admins can update a category.");
  }

  const existingCategory = await prisma.category.findUnique({ where: { id } });

  if (!existingCategory) {
    return ApiError.send(res, 404, "Category not found.");
  }

  let newImageFilename = existingCategory.image;

  if (req.file) {
    // Delete the old image if exists
    if (existingCategory.image) {
      const oldImageFileName = existingCategory.image.replace("/uploads/", "");
      const oldImagePath = path.join(
        __dirname,
        "../../public/uploads",
        oldImageFileName,
      );
      deleteOldImage(oldImagePath);
    }

    // Store new image path
    newImageFilename = `/uploads/${req.file.filename}`;
  }

  // Update the category
  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      name: name?.trim() || existingCategory.name,
      sku: sku?.trim() || existingCategory.sku,
      description: description?.trim() || existingCategory.description,
      image: newImageFilename,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Category updated successfully", {
      category: updatedCategory,
    }),
  );
});

// Delete category
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user?.role !== "Admin") {
    return ApiError.send(res, 403, "Only admins can delete a category.");
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id },
    include: { products: true },
  });

  if (!existingCategory) {
    return ApiError.send(res, 404, "Category not found.");
  }

  // Delete image file if it exists
  if (existingCategory.image) {
    const imageFileName = existingCategory.image.replace("/uploads/", "");
    const imagePath = path.join(
      __dirname,
      "../../public/uploads",
      imageFileName,
    );
    deleteOldImage(imagePath);
  }

  // Delete all products associated with the category
  if (existingCategory.products.length > 0) {
    await prisma.product.deleteMany({
      where: { categoryid: id },
    });
  }

  await prisma.category.delete({ where: { id } });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Category and its products deleted successfully"),
    );
});

export {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
