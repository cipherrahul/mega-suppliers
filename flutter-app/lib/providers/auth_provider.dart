import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  final ApiService _api = ApiService();

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _loadUser();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('agri_user');
    if (userJson != null) {
      _user = User.fromJson(jsonDecode(userJson));
      notifyListeners();
    }
  }

  Future<void> login(String phone, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _api.post('/auth/login', data: {
        'phone': phone,
        'password': password,
      });

      final token = response.data['token'];
      final userData = User.fromJson(response.data['user']);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('agri_token', token);
      await prefs.setString('agri_user', jsonEncode(userData.toJson()));

      _user = userData;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(String name, String phone, String password, String address) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.post('/auth/register', data: {
        'name': name,
        'phone': phone,
        'password': password,
        'address': address,
        'role': 'USER',
      });
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('agri_token');
    await prefs.remove('agri_user');
    _user = null;
    notifyListeners();
  }
}
