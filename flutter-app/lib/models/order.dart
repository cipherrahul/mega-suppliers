import 'product.dart';

class OrderItem {
  final String id;
  final String productId;
  final Product? product;
  final int quantity;
  final double priceAtPurchase;

  OrderItem({
    required this.id,
    required this.productId,
    this.product,
    required this.quantity,
    required this.priceAtPurchase,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      productId: json['productId'],
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
      quantity: json['quantity'],
      priceAtPurchase: (json['priceAtPurchase'] as num).toDouble(),
    );
  }
}

class Order {
  final String id;
  final String userId;
  final double totalPrice;
  final String status;
  final String address;
  final List<OrderItem> items;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.userId,
    required this.totalPrice,
    required this.status,
    required this.address,
    required this.items,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      userId: json['userId'],
      totalPrice: (json['totalPrice'] as num).toDouble(),
      status: json['status'],
      address: json['address'],
      items: (json['items'] as List).map((i) => OrderItem.fromJson(i)).toList(),
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
