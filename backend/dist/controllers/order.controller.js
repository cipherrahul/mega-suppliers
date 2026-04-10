"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getAllOrders = exports.getMyOrders = exports.createOrder = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// ─── Valid status transitions ─────────────────────────────────────────────────
const VALID_TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [], // Terminal state
    CANCELLED: [], // Terminal state
};
// ─── Create Order ─────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
    try {
        const { items, address } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required and must not be empty' });
        }
        if (!address || (typeof address === 'string' && address.trim().length < 10)) {
            return res.status(400).json({ error: 'A valid delivery address (min 10 characters) is required' });
        }
        const result = await prisma_1.default.$transaction(async (tx) => {
            let totalOrderPrice = 0;
            const orderItemsData = [];
            for (const item of items) {
                if (!item.productId || !item.quantity || item.quantity < 1) {
                    throw new Error('Each item must have a valid productId and quantity ≥ 1');
                }
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product || !product.isActive) {
                    throw new Error(`Product not found or unavailable`);
                }
                if (product.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity}`);
                }
                totalOrderPrice += product.price * item.quantity;
                orderItemsData.push({
                    productId: product.id,
                    quantity: item.quantity,
                    priceAtPurchase: product.price,
                });
                await tx.product.update({
                    where: { id: product.id },
                    data: { stockQuantity: { decrement: item.quantity } },
                });
            }
            const order = await tx.order.create({
                data: {
                    userId,
                    totalPrice: totalOrderPrice,
                    address: address.trim(),
                    status: 'PENDING',
                    items: { create: orderItemsData },
                },
                include: {
                    items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
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
// ─── Get My Orders ────────────────────────────────────────────────────────────
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orders = await prisma_1.default.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true, imageUrl: true, price: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};
exports.getMyOrders = getMyOrders;
// ─── Get All Orders (Admin) ───────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
    try {
        const { status, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = status && status !== 'ALL' ? { status: status } : {};
        const [orders, total] = await Promise.all([
            prisma_1.default.order.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: {
                    user: { select: { id: true, name: true, phone: true } },
                    items: {
                        include: {
                            product: { select: { id: true, name: true, imageUrl: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.order.count({ where }),
        ]);
        res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};
exports.getAllOrders = getAllOrders;
// ─── Update Order Status (Admin) ─────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const order = await prisma_1.default.order.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!order)
            return res.status(404).json({ error: 'Order not found' });
        const allowedNext = VALID_TRANSITIONS[order.status];
        if (!allowedNext.includes(status)) {
            return res.status(400).json({
                error: `Cannot transition order from ${order.status} to ${status}`,
                allowedTransitions: allowedNext,
            });
        }
        // Restore stock if cancelling
        if (status === 'CANCELLED') {
            await prisma_1.default.$transaction(async (tx) => {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stockQuantity: { increment: item.quantity } },
                    });
                }
                await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });
            });
        }
        else {
            await prisma_1.default.order.update({ where: { id }, data: { status } });
        }
        const updatedOrder = await prisma_1.default.order.findUnique({
            where: { id },
            include: { user: { select: { name: true, phone: true } }, items: true },
        });
        res.json(updatedOrder);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
};
exports.updateOrderStatus = updateOrderStatus;
