"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getAllOrders = exports.getMyOrders = exports.createOrder = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const createOrder = async (req, res) => {
    try {
        const { items, address } = req.body;
        const userId = req.user?.id;
        if (!items || !items.length || !address) {
            return res.status(400).json({ error: 'Items and address are required' });
        }
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Use a transaction to ensure atomic order creation
        const result = await prisma_1.default.$transaction(async (tx) => {
            let totalOrderPrice = 0;
            const orderItemsData = [];
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found`);
                }
                if (product.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${product.name}`);
                }
                const itemTotalPrice = product.price * item.quantity;
                totalOrderPrice += itemTotalPrice;
                orderItemsData.push({
                    productId: product.id,
                    quantity: item.quantity,
                    priceAtPurchase: product.price,
                });
                // Update stock
                await tx.product.update({
                    where: { id: product.id },
                    data: { stockQuantity: product.stockQuantity - item.quantity },
                });
            }
            const order = await tx.order.create({
                data: {
                    userId,
                    totalPrice: totalOrderPrice,
                    address,
                    status: 'PENDING',
                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: true,
                },
            });
            return order;
        });
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.createOrder = createOrder;
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orders = await prisma_1.default.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: { product: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMyOrders = getMyOrders;
const getAllOrders = async (req, res) => {
    try {
        const orders = await prisma_1.default.order.findMany({
            include: {
                user: { select: { name: true, phone: true } },
                items: {
                    include: { product: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllOrders = getAllOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const validStatuses = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const order = await prisma_1.default.order.update({
            where: { id },
            data: { status },
        });
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateOrderStatus = updateOrderStatus;
