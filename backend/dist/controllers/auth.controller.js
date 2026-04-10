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
const JWT_EXPIRES_IN = '30d';
const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian mobile numbers
const PASSWORD_MIN_LENGTH = 6;
const register = async (req, res) => {
    try {
        const { name, phone, password, address } = req.body;
        // Input validation
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }
        if (!phone || !PHONE_REGEX.test(phone)) {
            return res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required' });
        }
        if (!password || password.length < PASSWORD_MIN_LENGTH) {
            return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
        }
        // Conflict check
        const existingUser = await prisma_1.default.user.findUnique({ where: { phone } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this phone number already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.default.user.create({
            data: {
                name: name.trim(),
                phone,
                password: hashedPassword,
                address: address?.trim() || null,
                role: 'USER', // Never trust client to set role
            },
        });
        res.status(201).json({
            message: 'Account created successfully. Please log in.',
            user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone and password are required' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { phone } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({
            token,
            user: { id: user.id, name: user.name, phone: user.phone, role: user.role, address: user.address },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};
exports.login = login;
