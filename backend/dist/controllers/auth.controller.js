"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const register = async (req, res) => {
    try {
        const { name, phone, password, address, role } = req.body;
        if (!name || !phone || !password) {
            return res.status(400).json({ error: 'Name, phone, and password are required' });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { phone } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this phone already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                name,
                phone,
                password: hashedPassword,
                address,
                role: role === 'ADMIN' ? 'ADMIN' : 'USER',
            },
        });
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { phone } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid phone or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid phone or password' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            token,
            user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.login = login;
