import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ─── Get Products ─────────────────────────────────────────────────────────────
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { isActive: true };
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// ─── Get Product By ID ────────────────────────────────────────────────────────
export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// ─── Create Product (Admin) ───────────────────────────────────────────────────
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stockQuantity, imageUrl } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Product name must be at least 2 characters' });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }

    const parsedStock = parseInt(stockQuantity);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ error: 'Stock quantity must be a non-negative integer' });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: parsedPrice,
        stockQuantity: parsedStock,
        imageUrl: imageUrl?.trim() || null,
      },
    });

    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// ─── Update Product (Admin) ───────────────────────────────────────────────────
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description, price, stockQuantity, imageUrl } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Product name must be at least 2 characters' });
      }
      updates.name = name.trim();
    }
    if (description !== undefined) updates.description = description?.trim() || null;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl?.trim() || null;
    if (price !== undefined) {
      const p = parseFloat(price);
      if (isNaN(p) || p <= 0) return res.status(400).json({ error: 'Price must be a positive number' });
      updates.price = p;
    }
    if (stockQuantity !== undefined) {
      const s = parseInt(stockQuantity);
      if (isNaN(s) || s < 0) return res.status(400).json({ error: 'Stock must be non-negative' });
      updates.stockQuantity = s;
    }

    const product = await prisma.product.update({ where: { id }, data: updates });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// ─── Soft Delete Product (Admin) ─────────────────────────────────────────────
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Soft delete — preserve order history integrity
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Product removed from catalogue successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
