class ItemModel {
  final int id;
  final String name;
  final String? description;
  final int totalQuantity;
  final int availableQuantity;
  final String? imageUrl;
  final String status;

  ItemModel({
    required this.id,
    required this.name,
    this.description,
    required this.totalQuantity,
    required this.availableQuantity,
    this.imageUrl,
    required this.status,
  });

  factory ItemModel.fromJson(Map<String, dynamic> json) {
    return ItemModel(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'],
      totalQuantity: json['total_quantity'] ?? 0,
      availableQuantity: json['available_quantity'] ?? 0,
      imageUrl: json['image_url'],
      status: json['status'] ?? 'ACTIVE',
    );
  }
}
