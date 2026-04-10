import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = '30d';

const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian mobile numbers
const PASSWORD_MIN_LENGTH = 6;

export const register = async (req: Request, res: Response) => {
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
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
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
  } catch (error: any) {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (!phone && !email) {
      return res.status(400).json({ error: 'Phone or email is required' });
    }

    let user;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    } else {
      user = await prisma.user.findUnique({ where: { phone: phone.trim() } });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, address: user.address },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};
