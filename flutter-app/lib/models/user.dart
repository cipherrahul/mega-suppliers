class User {
  final String id;
  final String name;
  final String phone;
  final String? address;
  final String role;

  User({
    required this.id,
    required this.name,
    required this.phone,
    this.address,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
      address: json['address'],
      role: json['role'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'address': address,
      'role': role,
    };
  }
}
