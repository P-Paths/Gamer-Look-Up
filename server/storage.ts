import { type SteamLookupResponse, type User, type UserPlatformAccount, type GamingStats, type FriendsList, type GameActivity, type InsertUser, type InsertUserPlatformAccount, type Platform, type PlatformLookupResponse, type QualificationCriteria } from "@shared/schema";
import { db } from "./db";
import { users, userPlatformAccounts, gamingStats, friendsList, gameActivities } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Storage interface for multi-platform gaming data
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  
  // Platform account management
  getUserPlatformAccount(userId: string, platform: Platform): Promise<UserPlatformAccount | undefined>;
  createUserPlatformAccount(accountData: InsertUserPlatformAccount): Promise<UserPlatformAccount>;
  updateUserPlatformAccount(id: string, accountData: Partial<UserPlatformAccount>): Promise<UserPlatformAccount>;
  
  // Gaming stats
  getGamingStats(userPlatformAccountId: string): Promise<GamingStats | undefined>;
  updateGamingStats(userPlatformAccountId: string, stats: Partial<GamingStats>): Promise<GamingStats>;
  
  // Friends and activities
  getFriendsList(userPlatformAccountId: string): Promise<FriendsList[]>;
  getGameActivities(userPlatformAccountId: string): Promise<GameActivity[]>;
  
  // Qualification logic
  calculateQualification(totalHours: number, totalGames: number, criteria: QualificationCriteria): { status: "qualified" | "not_qualified", reason: string };
  
  // Legacy Steam cache (keeping for backwards compatibility)
  getCachedLookup(steamId: string): Promise<SteamLookupResponse | undefined>;
  setCachedLookup(steamId: string, data: SteamLookupResponse): Promise<void>;
  
  // Multi-platform cache
  getCachedPlatformLookup(platform: Platform, userId: string): Promise<PlatformLookupResponse | undefined>;
  setCachedPlatformLookup(platform: Platform, userId: string, data: PlatformLookupResponse): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private lookupCache: Map<string, { data: SteamLookupResponse; timestamp: number }>;
  private platformCache: Map<string, { data: PlatformLookupResponse; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.lookupCache = new Map();
    this.platformCache = new Map();
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Platform account management
  async getUserPlatformAccount(userId: string, platform: Platform): Promise<UserPlatformAccount | undefined> {
    const [account] = await db
      .select()
      .from(userPlatformAccounts)
      .where(and(eq(userPlatformAccounts.userId, userId), eq(userPlatformAccounts.platform, platform)));
    return account;
  }

  async createUserPlatformAccount(accountData: InsertUserPlatformAccount): Promise<UserPlatformAccount> {
    const [account] = await db.insert(userPlatformAccounts).values(accountData).returning();
    return account;
  }

  async updateUserPlatformAccount(id: string, accountData: Partial<UserPlatformAccount>): Promise<UserPlatformAccount> {
    const [account] = await db
      .update(userPlatformAccounts)
      .set({ ...accountData, updatedAt: new Date() })
      .where(eq(userPlatformAccounts.id, id))
      .returning();
    return account;
  }

  // Gaming stats
  async getGamingStats(userPlatformAccountId: string): Promise<GamingStats | undefined> {
    const [stats] = await db
      .select()
      .from(gamingStats)
      .where(eq(gamingStats.userPlatformAccountId, userPlatformAccountId));
    return stats;
  }

  async updateGamingStats(userPlatformAccountId: string, stats: Partial<GamingStats>): Promise<GamingStats> {
    const existing = await this.getGamingStats(userPlatformAccountId);
    if (existing) {
      const [updated] = await db
        .update(gamingStats)
        .set({ ...stats, updatedAt: new Date() })
        .where(eq(gamingStats.userPlatformAccountId, userPlatformAccountId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(gamingStats)
        .values({ userPlatformAccountId, ...stats })
        .returning();
      return created;
    }
  }

  // Friends and activities
  async getFriendsList(userPlatformAccountId: string): Promise<FriendsList[]> {
    return await db
      .select()
      .from(friendsList)
      .where(eq(friendsList.userPlatformAccountId, userPlatformAccountId));
  }

  async getGameActivities(userPlatformAccountId: string): Promise<GameActivity[]> {
    return await db
      .select()
      .from(gameActivities)
      .where(eq(gameActivities.userPlatformAccountId, userPlatformAccountId));
  }

  // Qualification logic
  calculateQualification(totalHours: number, totalGames: number, criteria: QualificationCriteria): { status: "qualified" | "not_qualified", reason: string } {
    const hoursPerDay = totalHours / 365; // Approximate daily hours
    const yearlyHours = totalHours;

    // Check criteria: 1-3 hours/day OR 1,100+ hours/year
    const dailyQualified = hoursPerDay >= criteria.dailyHoursMin && hoursPerDay <= criteria.dailyHoursMax;
    const yearlyQualified = yearlyHours >= criteria.yearlyHoursMin;

    if (dailyQualified) {
      return {
        status: "qualified",
        reason: `Plays ${hoursPerDay.toFixed(1)} hours/day (within 1-3 hour range)`
      };
    }

    if (yearlyQualified) {
      return {
        status: "qualified",
        reason: `${yearlyHours} total hours/year (exceeds 1,100 hour minimum)`
      };
    }

    return {
      status: "not_qualified",
      reason: `${hoursPerDay.toFixed(1)} hours/day and ${yearlyHours} yearly hours don't meet qualification criteria`
    };
  }

  // Legacy Steam cache (backwards compatibility)
  async getCachedLookup(steamId: string): Promise<SteamLookupResponse | undefined> {
    const cached = this.lookupCache.get(steamId);
    if (!cached) return undefined;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.lookupCache.delete(steamId);
      return undefined;
    }

    return cached.data;
  }

  async setCachedLookup(steamId: string, data: SteamLookupResponse): Promise<void> {
    this.lookupCache.set(steamId, {
      data,
      timestamp: Date.now(),
    });
  }

  // Multi-platform cache
  async getCachedPlatformLookup(platform: Platform, userId: string): Promise<PlatformLookupResponse | undefined> {
    const key = `${platform}:${userId}`;
    const cached = this.platformCache.get(key);
    if (!cached) return undefined;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.platformCache.delete(key);
      return undefined;
    }

    return cached.data;
  }

  async setCachedPlatformLookup(platform: Platform, userId: string, data: PlatformLookupResponse): Promise<void> {
    const key = `${platform}:${userId}`;
    this.platformCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

export const storage = new DatabaseStorage();
