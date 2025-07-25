/**
 * PSN Token Management System
 * Handles storage and validation of NPSSO tokens
 */

interface TokenRecord {
  userId: string;
  npssoToken: string;
  lastUpdated: Date;
  isValid: boolean;
}

class TokenManager {
  private tokens: Map<string, TokenRecord> = new Map();

  storeToken(userId: string, npssoToken: string): void {
    this.tokens.set(userId, {
      userId,
      npssoToken,
      lastUpdated: new Date(),
      isValid: true
    });
  }

  getToken(userId: string): string | null {
    const record = this.tokens.get(userId);
    return record?.npssoToken || null;
  }

  isTokenExpired(userId: string): boolean {
    const record = this.tokens.get(userId);
    if (!record) return true;

    const now = new Date();
    const diffInDays = (now.getTime() - record.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    // Consider token expired after 30 days
    return diffInDays > 30 || !record.isValid;
  }

  markTokenAsExpired(userId: string): void {
    const record = this.tokens.get(userId);
    if (record) {
      record.isValid = false;
      this.tokens.set(userId, record);
    }
  }

  getAllTokens(): TokenRecord[] {
    return Array.from(this.tokens.values());
  }

  removeToken(userId: string): void {
    this.tokens.delete(userId);
  }

  getTokenStatus(userId: string): { exists: boolean; isExpired: boolean; lastUpdated?: Date } {
    const record = this.tokens.get(userId);
    if (!record) {
      return { exists: false, isExpired: true };
    }

    return {
      exists: true,
      isExpired: this.isTokenExpired(userId),
      lastUpdated: record.lastUpdated
    };
  }
}

// Singleton instance
export const tokenManager = new TokenManager();

// For environment-based token (fallback)
export function getEnvironmentToken(): string | null {
  return process.env.PSN_NPSSO_TOKEN || null;
}

export function updateEnvironmentToken(newToken: string): void {
  process.env.PSN_NPSSO_TOKEN = newToken;
}