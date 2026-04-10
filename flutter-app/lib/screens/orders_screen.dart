import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/order.dart';
import 'package:intl/intl.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Order> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final response = await ApiService().get('/orders/my-orders');
      final List data = response.data;
      setState(() {
        _orders = data.map((json) => Order.fromJson(json)).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      print('Failed to fetch orders: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');
    final dateFormat = DateFormat('dd MMM yyyy, hh:mm a');

    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty
              ? const Center(child: Text('You have no orders yet!'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _orders.length,
                  itemBuilder: (ctx, i) {
                    final order = _orders[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Order #${order.id.substring(0, 8)}', 
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                _buildStatusBadge(order.status),
                              ],
                            ),
                            const Divider(height: 24),
                            ...order.items.map((item) => Padding(
                              padding: const EdgeInsets.only(bottom: 4.0),
                              child: Text('${item.quantity}x ${item.product?.name ?? "Product"}', 
                                style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                            )),
                            const Divider(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(dateFormat.format(order.createdAt), 
                                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                                Text(currencyFormat.format(order.totalPrice), 
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A))),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    Color bgColor;

    switch (status) {
      case 'PENDING':
        color = const Color(0xFFB45309);
        bgColor = const Color(0xFFFFF7ED);
        break;
      case 'CONFIRMED':
        color = const Color(0xFF1D4ED8);
        bgColor = const Color(0xFFEFF6FF);
        break;
      case 'DELIVERED':
        color = const Color(0xFF065F46);
        bgColor = const Color(0xFFF0FDF4);
        break;
      case 'CANCELLED':
        color = const Color(0xFF991B1B);
        bgColor = const Color(0xFFFEF2F2);
        break;
      default:
        color = Colors.grey;
        bgColor = Colors.grey[100]!;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(20)),
      child: Text(
        status,
        style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 10),
      ),
    );
  }
}
