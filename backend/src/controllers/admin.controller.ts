import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const [totalProducts, totalOrders, pendingOrders, totalUsers, totalSales] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'DELIVERED' },
      }),
    ]);

    const recentOrders = await prisma.order.findMany({
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
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};
