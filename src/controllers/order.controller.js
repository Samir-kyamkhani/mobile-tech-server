import prisma from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET all orders
export const getAllOrders = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  if (role === "Admin") {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
          },
        },
        shipping: true,
      },
    });

    return res.status(200).json(new ApiResponse(200, "Orders fetched", orders));
  }

  console.log("=============================================",id);
  

  if (role === "Customer") {
    // Fetch orders where customerId matches the logged-in user's id
    const customerOrders = await prisma.order.findMany({
      where: {
        customerid: id,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
          },
        },
        shipping: true,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Customer orders fetched", customerOrders));
  }

  return res.status(403).json(new ApiResponse(403, "Unauthorized"));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: {
              images: true,
              category: true,
            },
          },
        },
      },
      shipping: true,
    },
  });

  if (!order) {
    return ApiError.send(res, 404, "Order not found");
  }

  return res.status(200).json(new ApiResponse(200, "Order fetched", order));
});

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shipping } = req.body;
  const createdby = req.user?.id;

  if (req.user?.role !== "Customer") {
    return ApiError.send(res, 403, "Only Customers can order products.");
  }

  if (!items || !items.length || !shipping) {
    return ApiError.send(res, 400, "Missing required fields.");
  }

  // Fetch products to validate stock and price
  const productIds = items.map((item) => item.id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== items.length) {
    return ApiError.send(res, 400, "Some products are invalid.");
  }

  // Check stock availability and calculate total
  let total = 0;
  for (const item of items) {
    const product = products.find((p) => p.id === item.id);
    if (!product) {
      return ApiError.send(res, 400, `Product ${item.id} not found.`);
    }
    if (product.stock < item.quantity) {
      return ApiError.send(
        res,
        400,
        `Insufficient stock for product ${product.name}`,
      );
    }
    total += product.price * item.quantity;
  }

  const newShipping = await prisma.shippingAddress.create({
    data: {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      email: shipping.email,
      address: shipping.address,
      city: shipping.city,
      zip: shipping.zip,
    },
  });

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const order = await prisma.$transaction(async (prisma) => {
    const orderCreated = await prisma.order.create({
      data: {
        customerid: createdby,
        total,
        createdby,
        payment: "Pending",
        shippingId: newShipping.id,
        duedate: dueDate,
        items: {
          create: items.map((item) => ({
            productid: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
        shipping: true,
      },
    });

    // Update stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.id },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    return orderCreated;
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Order created Successfully", order));
});

export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { status, payment, duedate } = req.body;

  const existingOrder = await prisma.order.findUnique({ where: { id } });
  if (!existingOrder) {
    return ApiError.send(res, 404, "Order not found");
  }

  // Convert formatted string (e.g., "June 21, 2025") to a Date object
  if (duedate) {
    const parsedDate = new Date(duedate);
    // Optional: check if it's a valid date
    if (isNaN(parsedDate.getTime())) {
      return ApiError.send(res, 400, "Invalid date format");
    }
    duedate = parsedDate;
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status: status || existingOrder.status,
      payment: payment || existingOrder.payment,
      duedate: duedate || existingOrder.duedate,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Order updated", updatedOrder));
});

// DELETE order
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return ApiError.send(res, 400, "Order ID is required");
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existingOrder) {
    return ApiError.send(res, 404, "Order not found");
  }

  if (existingOrder.items.length > 0) {
    await prisma.orderItem.deleteMany({
      where: { orderid: id },
    });
  }

  await prisma.order.delete({ where: { id } });

  return res
    .status(200)
    .json(new ApiResponse(200, "Order deleted successfully"));
});
