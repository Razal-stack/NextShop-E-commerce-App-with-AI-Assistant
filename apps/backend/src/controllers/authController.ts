import { Request, Response } from 'express';
import { AuthService } from '../services';

export class AuthController {
  private authService = new AuthService();

  /**
   * POST /auth/login - User authentication
   */
  loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;
      
      const result = await this.authService.loginUser(username, password);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      });
    }
  };
}
