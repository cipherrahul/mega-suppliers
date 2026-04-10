"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// ─── Get Products ─────────────────────────────────────────────────────────────
const getProducts = async (req, res) => {
    try {
        const { search, page = '1', limit = '50' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = { isActive: true };
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        const [products, total] = await Promise.all([
            prisma_1.default.product.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.product.count({ where }),
        ]);
        res.json({ products, total });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
exports.getProducts = getProducts;
// ─── Get Product By ID ────────────────────────────────────────────────────────
const getProductById = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await prisma_1.default.product.findUnique({ where: { id } });
        if (!product || !product.isActive) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};
exports.getProductById = getProductById;
// ─── Create Product (Admin) ───────────────────────────────────────────────────
const createProduct = async (req, res) => {
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
        const product = await prisma_1.default.product.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                price: parsedPrice,
                stockQuantity: parsedStock,
                imageUrl: imageUrl?.trim() || null,
            },
        });
        res.status(201).json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
};
exports.createProduct = createProduct;
// ─── Update Product (Admin) ───────────────────────────────────────────────────
const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, price, stockQuantity, imageUrl } = req.body;
        const existing = await prisma_1.default.product.findUnique({ where: { id } });
        if (!existing || !existing.isActive) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const updates = {};
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length < 2) {
                return res.status(400).json({ error: 'Product name must be at least 2 characters' });
            }
            updates.name = name.trim();
        }
        if (description !== undefined)
            updates.description = description?.trim() || null;
        if (imageUrl !== undefined)
            updates.imageUrl = imageUrl?.trim() || null;
        if (price !== undefined) {
            const p = parseFloat(price);
            if (isNaN(p) || p <= 0)
                return res.status(400).json({ error: 'Price must be a positive number' });
            updates.price = p;
        }
        if (stockQuantity !== undefined) {
            const s = parseInt(stockQuantity);
            if (isNaN(s) || s < 0)
                return res.status(400).json({ error: 'Stock must be non-negative' });
            updates.stockQuantity = s;
        }
        const product = await prisma_1.default.product.update({ where: { id }, data: updates });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
};
exports.updateProduct = updateProduct;
// ─── Soft Delete Product (Admin) ─────────────────────────────────────────────
const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.default.product.findUnique({ where: { id } });
        if (!existing || !existing.isActive) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Soft delete — preserve order history integrity
        await prisma_1.default.product.update({ where: { id }, data: { isActive: false } });
        res.json({ message: 'Product removed from catalogue successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
exports.deleteProduct = deleteProduct;
