/**
 * User Service - Handles all user-related API calls
 */

import { User } from '../types';
import httpService from './httpService';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
}

export class UserService {
  /**
   * Get all users
   */
  static async getUsers(): Promise<User[]> {
    const response = await httpService.get<User[]>('/users');
    return response.data;
  }

  /**
   * Get a single user by ID
   */
  static async getUser(id: number): Promise<User> {
    const response = await httpService.get<User>(`/users/${id}`);
    return response.data;
  }

  /**
   * Create a new user
   */
  static async createUser(user: Omit<User, 'id'>): Promise<User> {
    const response = await httpService.post<User>('/users', user);
    return response.data;
  }

  /**
   * Update an existing user
   */
  static async updateUser(id: number, user: Partial<User>): Promise<User> {
    const response = await httpService.put<User>(`/users/${id}`, user);
    return response.data;
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: number): Promise<void> {
    await httpService.delete(`/users/${id}`);
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await httpService.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }
}
