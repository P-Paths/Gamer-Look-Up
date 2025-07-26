import axios from 'axios';
import { type Platform, type PlatformLookupResponse, type FriendData, type QualificationCriteria } from '@shared/schema';
import { storage } from './storage';
// Commented out psn-api due to authentication issues - implementing direct API approach
// import { exchangeNpssoForAccessCode, getUserTitles, makeUniversalSearch } from 'psn-api';

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
      console.log(`Steam cache hit for user: ${gamerTag} (Steam ID: ${steamId})`);
      return cached;
    }
    
    console.log(`Steam cache miss for user: ${gamerTag} (Steam ID: ${steamId}), fetching from API`);
    const startTime = Date.now();

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
    const fetchTime = Date.now() - startTime;
    console.log(`Steam data fetched and cached for ${gamerTag} in ${fetchTime}ms (${totalGames} games, ${totalHours} hours)`);

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
    return {
      accessToken: authCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async lookupPlayer(gamerTag: string, accessToken?: string): Promise<PlatformLookupResponse> {
    console.log(`Real PlayStation lookup for: ${gamerTag || 'current user'}`);
    
    // Get NPSSO token from environment
    const npsso = process.env.PSN_NPSSO_TOKEN;
    if (!npsso) {
      throw new Error('PSN_NPSSO_TOKEN environment variable is required for PlayStation lookups');
    }
    
    // Check cache first
    const cacheKey = gamerTag ? `psn_${gamerTag.toLowerCase()}` : 'psn_current_user';
    const cached = await storage.getCachedPlatformLookup("playstation", cacheKey);
    if (cached) {
      console.log(`PlayStation cache hit for: ${gamerTag || 'current user'}`);
      return cached;
    }

    try {
      // Import the real PSN integration
      const { getCompletePSNData } = await import('./psn/index');
      
      const psnData = await getCompletePSNData(npsso);
      
      if (psnData.success) {
        // Convert to our standard platform response format
        const response: PlatformLookupResponse = {
          platform: "playstation",
          player: {
            id: psnData.profile.accountId,
            gamerTag: psnData.profile.onlineId,
            displayName: psnData.profile.onlineId,
            avatar: psnData.profile.avatar,
            lastOnline: "Recently active",
          },
          totalHours: psnData.gaming.totalHours,
          totalGames: psnData.gaming.totalGames,
          avgHoursPerGame: psnData.gaming.totalGames > 0 ? 
            Math.round((psnData.gaming.totalHours / psnData.gaming.totalGames) * 10) / 10 : 0,
          topGames: psnData.gaming.topGames.map(game => ({
            id: `psn_${game.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
            name: game.name,
            hoursPlayed: game.hours,
            platform: "playstation" as Platform,
            lastPlayed: game.lastPlayed,
          })),
          qualificationStatus: psnData.gaming.totalHours > 1100 ? "qualified" : "not_qualified",
          qualificationReason: `Real PlayStation data: ${psnData.gaming.totalHours} hours, Level ${psnData.trophies.level}`,
          realData: true,
          trophies: psnData.trophies
        };

        // Cache the real data
        await storage.setCachedPlatformLookup("playstation", psnData.profile.accountId, response);
        
        console.log(`Real PlayStation data fetched for ${psnData.profile.onlineId}: ${psnData.gaming.totalHours} hours across ${psnData.gaming.totalGames} games`);
        return response;
      } else {
        throw new Error(psnData.error || 'Failed to fetch PlayStation data');
      }
      
    } catch (error) {
      console.error('Real PSN lookup error:', error);
      throw new Error(error instanceof Error ? error.message : 'PlayStation lookup failed');
    }
  }

  async getFriends(platformUserId: string, accessToken: string): Promise<FriendData[]> {
    return [];
  }
}

export class XboxService implements PlatformService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENXBL_API_KEY || "";
  }

  async authenticate(authCode: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    return {
      accessToken: this.apiKey || authCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async lookupPlayer(gamerTag: string, accessToken?: string): Promise<PlatformLookupResponse> {
    const token = accessToken || this.apiKey;
    
    if (!token) {
      throw new Error("OpenXBL API key not configured");
    }

    try {
      // Use RealGamingDataService with OpenXBL integration
      const { RealGamingDataService } = await import('./services/realGamingDataService');
      const gamingService = new RealGamingDataService();
      
      console.log(`🎮 Using OpenXBL API for Xbox lookup: ${gamerTag}`);
      const realData = await gamingService.getRealGamingData(gamerTag, 'xbox');
      
      if (!realData) {
        throw new Error(`Xbox profile not found for: ${gamerTag}`);
      }

      const response: PlatformLookupResponse = {
        platform: "xbox",
        player: {
          id: `xbox_${gamerTag.toLowerCase()}`,
          gamerTag: realData.gamerTag,
          displayName: realData.displayName,
          avatar: realData.avatar || "https://via.placeholder.com/64x64/107c10/ffffff?text=XBX",
          lastOnline: "Recently active",
          gamerscore: realData.gamerscore
        },
        totalHours: realData.totalHours,
        totalGames: realData.totalGames,
        avgHoursPerGame: realData.totalGames > 0 ? 
          Math.round((realData.totalHours / realData.totalGames) * 10) / 10 : 0,
        topGames: realData.games.map(game => ({
          id: `xbox_${game.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${gamerTag}`,
          name: game.name,
          hoursPlayed: game.hoursPlayed,
          platform: "xbox" as Platform,
          lastPlayed: game.lastPlayed,
        })),
        qualificationStatus: realData.totalHours > 0 ? "qualified" : "not_qualified",
        qualificationReason: realData.dataSource.includes('$5 plan') 
          ? `${realData.dataSource} - Gamerscore: ${realData.gamerscore}`
          : `Real Xbox data: ${realData.totalHours} hours, Gamerscore: ${realData.gamerscore}`,
        realData: true
      };

      // Cache the authentic data
      await storage.setCachedPlatformLookup("xbox", response.player.id, response);
      console.log(`✅ Real Xbox data cached for ${gamerTag}: ${realData.gamerscore} gamerscore`);
      
      return response;

    } catch (error: any) {
      console.error('OpenXBL lookup error:', error);
      throw new Error(error.message || 'Xbox lookup failed');
    }
  }

  async getFriends(platformUserId: string, accessToken: string): Promise<FriendData[]> {
    return [];
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