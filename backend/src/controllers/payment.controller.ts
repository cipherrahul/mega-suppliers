import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../utils/prisma';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export const createRazorpayOrder = async (req: Request, res: Response) => {
  const { amount } = req.body;
  
  const options = {
    amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    orderId // Our internal order ID
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    try {
      // Update our internal order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
      });
      res.json({ status: 'success', message: 'Payment verified successfully' });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: 'Failed to update order status' });
    }
  } else {
    res.status(400).json({ status: 'failure', message: 'Invalid payment signature' });
  }
};
