import { v4 as uuidv4 } from 'uuid';

export interface UserSession {
  token: string;
  userId: number;
  username: string;
  createdAt: Date;
}

export class SessionManager {
  private sessions: Map<string, UserSession> = new Map();

  setSession(sessionId: string, session: Omit<UserSession, 'createdAt'>): void {
    this.sessions.set(sessionId, {
      ...session,
      createdAt: new Date()
    });
  }

  getSession(sessionId: string): UserSession | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired (24 hours)
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const isExpired = Date.now() - session.createdAt.getTime() > expirationTime;
    
    if (isExpired) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  createSessionId(): string {
    return uuidv4();
  }

  // Cleanup expired sessions
  cleanupExpiredSessions(): void {
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      const isExpired = now - session.createdAt.getTime() > expirationTime;
      if (isExpired) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Get all active sessions (for debugging)
  getActiveSessions(): Map<string, UserSession> {
    this.cleanupExpiredSessions();
    return new Map(this.sessions);
  }
}
