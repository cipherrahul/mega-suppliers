"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getProducts = async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await prisma_1.default.product.findUnique({ where: { id } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stockQuantity, imageUrl } = req.body;
        if (!name || price === undefined || stockQuantity === undefined) {
            return res.status(400).json({ error: 'Name, price, and stockQuantity are required' });
        }
        const product = await prisma_1.default.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                stockQuantity: parseInt(stockQuantity),
                imageUrl,
            },
        });
        res.status(201).json(product);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, price, stockQuantity, imageUrl } = req.body;
        const existingProduct = await prisma_1.default.product.findUnique({ where: { id } });
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const product = await prisma_1.default.product.update({
            where: { id },
            data: {
                name,
                description,
                price: price !== undefined ? parseFloat(price) : undefined,
                stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : undefined,
                imageUrl,
            },
        });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const existingProduct = await prisma_1.default.product.findUnique({ where: { id } });
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        await prisma_1.default.product.delete({ where: { id } });
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteProduct = deleteProduct;
