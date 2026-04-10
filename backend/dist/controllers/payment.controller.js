"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.createRazorpayOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});
const createRazorpayOrder = async (req, res) => {
    const { amount } = req.body;
    const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createRazorpayOrder = createRazorpayOrder;
const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId // Our internal order ID
     } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto_1.default
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
        .update(body.toString())
        .digest("hex");
    if (expectedSignature === razorpay_signature) {
        try {
            // Update our internal order status
            await prisma_1.default.order.update({
                where: { id: orderId },
                data: { status: 'CONFIRMED' },
            });
            res.json({ status: 'success', message: 'Payment verified successfully' });
        }
        catch (error) {
            res.status(500).json({ status: 'error', message: 'Failed to update order status' });
        }
    }
    else {
        res.status(400).json({ status: 'failure', message: 'Invalid payment signature' });
    }
};
exports.verifyPayment = verifyPayment;
