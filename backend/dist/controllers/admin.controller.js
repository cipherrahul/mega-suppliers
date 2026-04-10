"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getDashboardSummary = async (req, res) => {
    try {
        const [totalProducts, totalOrders, pendingOrders, totalUsers, totalSales] = await Promise.all([
            prisma_1.default.product.count({ where: { isActive: true } }),
            prisma_1.default.order.count(),
            prisma_1.default.order.count({ where: { status: 'PENDING' } }),
            prisma_1.default.user.count({ where: { role: 'USER' } }),
            prisma_1.default.order.aggregate({
                _sum: { totalPrice: true },
                where: { status: 'DELIVERED' },
            }),
        ]);
        const recentOrders = await prisma_1.default.order.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, phone: true } },
                items: {
                    include: {
                        product: { select: { name: true, imageUrl: true } },
                    },
                },
            },
        });
        res.json({
            totalProducts,
            totalOrders,
            pendingOrders,
            totalUsers,
            totalRevenue: totalSales._sum.totalPrice || 0,
            recentOrders,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
};
exports.getDashboardSummary = getDashboardSummary;
