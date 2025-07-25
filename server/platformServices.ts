import axios from 'axios';
import { type Platform, type PlatformLookupResponse, type FriendData, type QualificationCriteria } from '@shared/schema';
import { storage } from './storage';

export interface PlatformService {
  authenticate(authCode: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;
  lookupPlayer(gamerTag: string, accessToken?: string): Promise<PlatformLookupResponse>;
  getFriends(platformUserId: string, accessToken: string): Promise<FriendData[]>;
}

export class SteamService implements PlatformService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.STEAM_API_KEY || process.env.STEAM_WEB_API_KEY || "";
  }

  async authenticate(authCode: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    // Steam doesn't use OAuth, but we'll return the API key as token for consistency
    return {
      accessToken: this.apiKey,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };
  }

  async lookupPlayer(gamerTag: string, accessToken?: string): Promise<PlatformLookupResponse> {
    if (!this.apiKey) {
      throw new Error("Steam API key not configured");
    }

    // Step 1: Resolve gamer tag to SteamID64
    let steamId = gamerTag;
    
    if (!/^765\d{14}$/.test(gamerTag)) {
      const vanityResponse = await axios.get(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/`,
        {
          params: {
            key: this.apiKey,
            vanityurl: gamerTag,
          },
        }
      );

      if (vanityResponse.data.response.success !== 1) {
        throw new Error("Steam profile not found. Please check the gamer tag and try again.");
      }

      steamId = vanityResponse.data.response.steamid;
    }

    // Check cache first
    const cached = await storage.getCachedPlatformLookup("steam", steamId);
    if (cached) {
      return cached;
    }

    // Step 2: Get player summary
    const playerResponse = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`,
      {
        params: {
          key: this.apiKey,
          steamids: steamId,
        },
      }
    );

    const players = playerResponse.data.response.players;
    if (!players || players.length === 0) {
      throw new Error("Steam profile not found or may be private.");
    }

    const player = players[0];
    
    if (player.communityvisibilitystate !== 3) {
      throw new Error("This Steam profile is private to the Steam Web API. To fix this:\\n\\n1. Open Steam client\\n2. Go to Steam → View → Settings\\n3. Click 'Privacy Settings'\\n4. Set 'My Profile' to 'Public'\\n5. Set 'Game Details' to 'Public'\\n6. Wait a few minutes for changes to take effect");
    }

    // Step 3: Get owned games
    const gamesResponse = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
      {
        params: {
          key: this.apiKey,
          steamid: steamId,
          format: "json",
          include_appinfo: 1,
          include_played_free_games: 1,
        },
      }
    );

    if (!gamesResponse.data.response.games) {
      throw new Error("This Steam profile's game details are private. To fix this:\\n\\n1. Go to Steam → View → Settings → Privacy Settings\\n2. Set 'My Profile' to Public\\n3. Set 'Game Details' to Public\\n4. Set 'My Game Library' to Public\\n\\nNote: Changes may take a few minutes to take effect.");
    }

    const games = gamesResponse.data.response.games || [];
    
    // Calculate statistics
    const totalMinutes = games.reduce((sum: number, game: any) => sum + game.playtime_forever, 0);
    const totalHours = Math.round(totalMinutes / 60);
    const totalGames = games.length;
    const avgHoursPerGame = totalGames > 0 ? Math.round((totalHours / totalGames) * 10) / 10 : 0;

    // Get top 3 most played games
    const topGames = games
      .sort((a: any, b: any) => b.playtime_forever - a.playtime_forever)
      .slice(0, 3)
      .map((game: any) => ({
        id: game.appid.toString(),
        name: game.name,
        hoursPlayed: Math.round(game.playtime_forever / 60),
        platform: "steam" as Platform,
        lastPlayed: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : undefined,
      }));

    // Calculate qualification
    const criteria: QualificationCriteria = { dailyHoursMin: 1, dailyHoursMax: 3, yearlyHoursMin: 1100 };
    const qualification = storage.calculateQualification(totalHours, totalGames, criteria);

    // Format last logoff time
    let lastOnline = "Unknown";
    if (player.lastlogoff) {
      const lastLogoff = new Date(player.lastlogoff * 1000);
      const now = new Date();
      const diffMs = now.getTime() - lastLogoff.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) {
        lastOnline = "Less than an hour ago";
      } else if (diffHours < 24) {
        lastOnline = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        lastOnline = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        lastOnline = lastLogoff.toLocaleDateString();
      }
    }

    const response: PlatformLookupResponse = {
      platform: "steam",
      player: {
        id: steamId,
        gamerTag: gamerTag,
        displayName: player.personaname,
        avatar: player.avatarfull,
        lastOnline,
      },
      totalHours,
      totalGames,
      avgHoursPerGame,
      topGames,
      qualificationStatus: qualification.status,
      qualificationReason: qualification.reason,
    };

    // Cache the response
    await storage.setCachedPlatformLookup("steam", steamId, response);

    return response;
  }

  async getFriends(platformUserId: string, accessToken: string): Promise<FriendData[]> {
    // Steam friends API implementation would go here
    // For now, return empty array as Steam friends API requires additional permissions
    return [];
  }
}

export class PlayStationService implements PlatformService {
  async authenticate(authCode: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    // PlayStation Network OAuth implementation would go here
    // This would require PSN API credentials and OAuth flow
    throw new Error("PlayStation authentication not yet implemented. Coming soon!");
  }

  async lookupPlayer(gamerTag: string, accessToken?: string): Promise<PlatformLookupResponse> {
    // PSN API implementation would go here
    throw new Error("PlayStation lookup not yet implemented. Coming soon!");
  }

  async getFriends(platformUserId: string, accessToken: string): Promise<FriendData[]> {
    // PSN friends API implementation would go here
    throw new Error("PlayStation friends lookup not yet implemented. Coming soon!");
  }
}

export class XboxService implements PlatformService {
  async authenticate(authCode: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    // Xbox Live OAuth implementation would go here
    // This would require Xbox Live API credentials and OAuth flow
    throw new Error("Xbox authentication not yet implemented. Coming soon!");
  }

  async lookupPlayer(gamerTag: string, accessToken?: string): Promise<PlatformLookupResponse> {
    // Xbox Live API implementation would go here
    throw new Error("Xbox lookup not yet implemented. Coming soon!");
  }

  async getFriends(platformUserId: string, accessToken: string): Promise<FriendData[]> {
    // Xbox Live friends API implementation would go here
    throw new Error("Xbox friends lookup not yet implemented. Coming soon!");
  }
}

export function getPlatformService(platform: Platform): PlatformService {
  switch (platform) {
    case "steam":
      return new SteamService();
    case "playstation":
      return new PlayStationService();
    case "xbox":
      return new XboxService();
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}