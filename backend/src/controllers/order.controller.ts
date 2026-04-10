import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

// ─── Valid status transitions ─────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],  // Terminal state
  CANCELLED: [],  // Terminal state
};

// ─── Create Order ─────────────────────────────────────────────────────────────
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, address } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required and must not be empty' });
    }

    if (!address || (typeof address === 'string' && address.trim().length < 10)) {
      return res.status(400).json({ error: 'A valid delivery address (min 10 characters) is required' });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// ─── Get My Orders ────────────────────────────────────────────────────────────
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await prisma.order.findMany({
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
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// ─── Get All Orders (Admin) ───────────────────────────────────────────────────
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where = status && status !== 'ALL' ? { status: status as any } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit as string),
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
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// ─── Update Order Status (Admin) ─────────────────────────────────────────────
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const allowedNext = VALID_TRANSITIONS[order.status];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition order from ${order.status} to ${status}`,
        allowedTransitions: allowedNext,
      });
    }

    // Restore stock if cancelling
    if (status === 'CANCELLED') {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
        await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });
      });
    } else {
      await prisma.order.update({ where: { id }, data: { status } });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, phone: true } }, items: true },
    });

    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
