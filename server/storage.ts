import { type SteamLookupResponse } from "@shared/schema";

// Storage interface for caching Steam API responses
export interface IStorage {
  // Cache Steam lookup results to reduce API calls
  getCachedLookup(steamId: string): Promise<SteamLookupResponse | undefined>;
  setCachedLookup(steamId: string, data: SteamLookupResponse): Promise<void>;
}

export class MemStorage implements IStorage {
  private lookupCache: Map<string, { data: SteamLookupResponse; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.lookupCache = new Map();
  }

  async getCachedLookup(steamId: string): Promise<SteamLookupResponse | undefined> {
    const cached = this.lookupCache.get(steamId);
    if (!cached) return undefined;

    // Check if cache is expired
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
}

export const storage = new MemStorage();
