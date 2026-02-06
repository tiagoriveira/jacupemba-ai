import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import 'package:flutter_masonry_view/flutter_masonry_view.dart';
import 'package:url_launcher/url_launcher.dart';

class VitrineScreen extends StatefulWidget {
  const VitrineScreen({Key? key}) : super(key: key);

  @override
  State<VitrineScreen> createState() => _VitrineScreenState();
}

class VitrinePost {
  final String id;
  final String sellerName;
  final String sellerPhone;
  final String title;
  final String? description;
  final double? price;
  final String category;
  final String mediaUrl;
  final String mediaType;
  final String expiresAt;
  final int views;
  final int clicks;
  final String status;
  final String createdAt;

  VitrinePost({
    required this.id,
    required this.sellerName,
    required this.sellerPhone,
    required this.title,
    this.description,
    this.price,
    required this.category,
    required this.mediaUrl,
    required this.mediaType,
    required this.expiresAt,
    required this.views,
    required this.clicks,
    required this.status,
    required this.createdAt,
  });

  factory VitrinePost.fromJson(Map<String, dynamic> json) {
    return VitrinePost(
      id: json['id'],
      sellerName: json['seller_name'],
      sellerPhone: json['seller_phone'],
      title: json['title'],
      description: json['description'],
      price: json['price']?.toDouble(),
      category: json['category'],
      mediaUrl: json['media_url'],
      mediaType: json['media_type'] ?? 'image',
      expiresAt: json['expires_at'],
      views: json['views'] ?? 0,
      clicks: json['clicks'] ?? 0,
      status: json['status'],
      createdAt: json['created_at'],
    );
  }
}

class _VitrineScreenState extends State<VitrineScreen> {
  final supabase = Supabase.instance.client;
  late Future<List<VitrinePost>> _vitrineFuture;
  VitrinePost? _selectedPost;

  @override
  void initState() {
    super.initState();
    _vitrineFuture = _fetchVitrinePosts();
  }

  Future<List<VitrinePost>> _fetchVitrinePosts() async {
    try {
      final response = await supabase
          .from('vitrine_posts')
          .select()
          .eq('status', 'aprovado')
          .gte('expires_at', DateTime.now().toIso8601String())
          .order('created_at', ascending: false);

      return (response as List)
          .map((item) => VitrinePost.fromJson(item))
          .toList();
    } catch (e) {
      debugPrint('Error fetching vitrine posts: $e');
      return [];
    }
  }

  void _openPostDetails(VitrinePost post) {
    setState(() => _selectedPost = post);
    _recordClick(post.id);
  }

  Future<void> _recordClick(String postId) async {
    try {
      await supabase.rpc('increment_clicks', params: {'post_id': postId});
    } catch (e) {
      debugPrint('Error recording click: $e');
    }
  }

  Future<void> _contactSeller(String phone) async {
    final url = 'https://wa.me/55$phone';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Vitrine do Bairro'),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        titleTextStyle: const TextStyle(
          color: Colors.black,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: FutureBuilder<List<VitrinePost>>(
        future: _vitrineFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Erro: ${snapshot.error}'));
          }

          final posts = snapshot.data ?? [];

          if (posts.isEmpty) {
            return const Center(
              child: Text(
                'Nenhum anuncio disponivel',
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
            );
          }

          return Stack(
            children: [
              MasonryView(
                brick: _buildMasonryBrick,
                bricks: posts,
                columnCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.7,
              ),
              if (_selectedPost != null)
                _buildDetailModal(_selectedPost!),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMasonryBrick(item) {
    final post = item as VitrinePost;
    return GestureDetector(
      onTap: () => _openPostDetails(post),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.grey[100],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Imagem
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: Image.network(
                post.mediaUrl,
                height: 150,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 150,
                    color: Colors.grey[300],
                    child: const Icon(Icons.image_not_supported),
                  );
                },
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (post.price != null)
                    Text(
                      'R\$ ${post.price!.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    post.sellerName,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailModal(VitrinePost post) {
    final expiresAt = DateTime.parse(post.expiresAt);
    final daysLeft = expiresAt.difference(DateTime.now()).inDays;

    return GestureDetector(
      onTap: () => setState(() => _selectedPost = null),
      child: Container(
        color: Colors.black.withOpacity(0.5),
        child: Center(
          child: GestureDetector(
            onTap: () {}, // Previne fechar ao tocar no modal
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Fechar button
                    Align(
                      alignment: Alignment.topRight,
                      child: IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => setState(() => _selectedPost = null),
                      ),
                    ),
                    // Imagem
                    ClipRRect(
                      borderRadius: const BorderRadius.all(Radius.circular(12)),
                      child: Image.network(
                        post.mediaUrl,
                        height: 250,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Categoria
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.grey[200],
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              post.category,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          // Titulo e preco
                          Text(
                            post.title,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          if (post.price != null)
                            Text(
                              'R\$ ${post.price!.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                          const SizedBox(height: 12),
                          // Descricao
                          if (post.description != null)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Descricao',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  post.description!,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey,
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],
                            ),
                          // Vendedor
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Vendedor',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  post.sellerName,
                                  style: const TextStyle(fontSize: 14),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  post.sellerPhone,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Colors.blue,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          // Validade
                          Row(
                            children: [
                              const Icon(Icons.access_time, size: 16, color: Colors.grey),
                              const SizedBox(width: 8),
                              Text(
                                daysLeft > 0
                                    ? 'Valido por mais $daysLeft dias'
                                    : 'Anuncio expirado',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          // Botao contato
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () => _contactSeller(post.sellerPhone),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: const Text(
                                'Conversar via WhatsApp',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
