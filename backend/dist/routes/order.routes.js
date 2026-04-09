"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// User routes
router.post('/', auth_middleware_1.authenticate, order_controller_1.createOrder);
router.get('/my-orders', auth_middleware_1.authenticate, order_controller_1.getMyOrders);
// Admin routes
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.authorizeAdmin, order_controller_1.getAllOrders);
router.patch('/:id/status', auth_middleware_1.authenticate, auth_middleware_1.authorizeAdmin, order_controller_1.updateOrderStatus);
exports.default = router;
