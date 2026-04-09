class Product {
  final String id;
  final String name;
  final String? description;
  final double price;
  final int stockQuantity;
  final String? imageUrl;

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.stockQuantity,
    this.imageUrl,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      price: (json['price'] as num).toDouble(),
      stockQuantity: json['stockQuantity'],
      imageUrl: json['imageUrl'],
    );
  }
}
