import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const [totalProducts, totalOrders, totalUsers, totalSales] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'DELIVERED' },
      }),
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });

    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: totalSales._sum.totalPrice || 0,
      recentOrders,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
