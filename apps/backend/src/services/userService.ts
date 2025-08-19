/**
 * User service for FakeStore API integration
 */

import { FakeStoreAPI } from './fakeStore';

export class UserService {
  private fakeStoreAPI: FakeStoreAPI;

  constructor() {
    this.fakeStoreAPI = new FakeStoreAPI();
  }

  async getAllUsers(options: { limit?: number } = {}) {
    try {
      const users = await this.fakeStoreAPI.getUsers(options.limit);
      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      };
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.fakeStoreAPI.getUser(id);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to fetch user ${id}`
      };
    }
  }

  async loginUser(username: string, password: string) {
    try {
      const result = await this.fakeStoreAPI.loginUser(username, password);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to login'
      };
    }
  }

  async createUser(userData: any) {
    try {
      const user = await this.fakeStoreAPI.createUser(userData);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
    }
  }

  async updateUser(id: number, userData: any) {
    try {
      const user = await this.fakeStoreAPI.updateUser(id, userData);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to update user ${id}`
      };
    }
  }

  async deleteUser(id: number) {
    try {
      const user = await this.fakeStoreAPI.deleteUser(id);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to delete user ${id}`
      };
    }
  }
}
