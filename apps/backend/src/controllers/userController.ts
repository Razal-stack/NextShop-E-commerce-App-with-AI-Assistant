/**
 * User controller for Express REST API
 */

import { Request, Response } from 'express';
import { UserService } from '../services';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Get all users
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit } = req.query;
      
      const result = await this.userService.getAllUsers({
        limit: limit ? Number(limit) : undefined
      });
      
      if (!result.success) {
        res.status(500).json({ error: result.error });
        return;
      }
      
      res.json(result.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  // Get single user by ID
  getUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = Number(id);
      
      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }
      
      const result = await this.userService.getUserById(userId);
      
      if (!result.success) {
        res.status(404).json({ error: result.error });
        return;
      }
      
      res.json(result.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  };

  // User login
  loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }
      
      const result = await this.userService.loginUser(username, password);
      
      if (!result.success) {
        res.status(401).json({ error: result.error });
        return;
      }
      
      res.json(result.data);
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  };

  // Create new user (FakeStore standard)
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = req.body;
      
      const result = await this.userService.createUser(userData);
      
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
      
      res.status(201).json(result.data);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  };

  // Update user (FakeStore standard)
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = Number(id);
      const userData = req.body;
      
      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }
      
      const result = await this.userService.updateUser(userId, userData);
      
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
      
      res.json(result.data);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  };

  // Delete user (FakeStore standard)
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = Number(id);
      
      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }
      
      const result = await this.userService.deleteUser(userId);
      
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
      
      res.json(result.data);
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  };
}
