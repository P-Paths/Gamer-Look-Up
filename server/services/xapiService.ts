import axios from 'axios';
import { Platform, PlatformLookupResponse } from '../../shared/schema';

export class XAPIService {
  private apiToken: string;
  private baseUrl = 'https://xapi.us/v2';

  constructor() {
    this.apiToken = process.env.XAPI_TOKEN || "";
    if (!this.apiToken) {
      console.warn('⚠️ XAPI_TOKEN not found - Xbox real playtime data unavailable');
    }
  }

  async lookupPlayer(gamerTag: string): Promise<PlatformLookupResponse> {
    if (!this.apiToken) {
      throw new Error("XAPI token not configured");
    }

    console.log(`🎮 Using XAPI.us for Xbox lookup: ${gamerTag}`);

    try {
      // Step 1: Get player profile
      const profileResponse = await axios.get(`${this.baseUrl}/profile/gamertag/${encodeURIComponent(gamerTag)}`, {
        headers: {
          'X-AUTH': this.apiToken,
          'Accept': 'application/json'
        }
      });

      const profile = profileResponse.data;
      console.log(`✅ Found XAPI profile: ${profile.gamertag} (XUID: ${profile.xuid})`);

      // Step 2: Get game stats with real playtime
      const gamesResponse = await axios.get(`${this.baseUrl}/game-stats/gamertag/${encodeURIComponent(gamerTag)}`, {
        headers: {
          'X-AUTH': this.apiToken,
          'Accept': 'application/json'
        }
      });

      const gameStats = gamesResponse.data;
      console.log(`🎮 XAPI: Retrieved ${gameStats.titles?.length || 0} games with real playtime data`);

      // Process games with authentic playtime
      const games = (gameStats.titles || []).slice(0, 10).map((game: any, index: number) => {
        const realMinutes = game.stats?.find((stat: any) => stat.name === 'MinutesPlayed')?.value || 0;
        const realHours = Math.round(realMinutes / 60);
        
        console.log(`Game ${index + 1}: ${game.name} - Real Hours: ${realHours}h (${realMinutes} minutes)`);
        
        return {
          id: game.titleId || `xapi_${index}`,
          name: game.name || 'Unknown Game',
          hoursPlayed: realHours, // REAL playtime data from XAPI
          platform: 'xbox' as Platform,
          lastPlayed: game.lastTimePlayed || 'Recently',
          // Additional authentic data
          gamerscore: game.gamerscore || 0,
          achievementsUnlocked: game.achievementsUnlocked || 0,
          totalAchievements: game.achievementsTotal || 0,
          percentComplete: game.completionPercentage || 0
        };
      });

      const totalHours = games.reduce((sum: number, game: any) => sum + game.hoursPlayed, 0);
      console.log(`📊 XAPI real gaming stats: ${games.length} games, ${totalHours} authentic hours`);

      return {
        platform: 'xbox',
        player: {
          id: profile.xuid,
          gamerTag: profile.gamertag,
          displayName: profile.gamertag,
          avatar: profile.gamerpic || '',
          lastOnline: 'Recently',
          gamerscore: profile.gamerscore || 0
        },
        totalGames: games.length,
        totalHours, // Real hours from XAPI
        avgHoursPerGame: games.length > 0 ? Math.round(totalHours / games.length) : 0,
        qualificationStatus: 'authentic' as const,
        qualificationReason: 'Real playtime data from XAPI.us premium API',
        topGames: games,
        recentActivity: [],
        socialData: {
          friends: [],
          recentPlayers: []
        }
      };

    } catch (error: any) {
      console.error('❌ XAPI lookup failed:', error.response?.data || error.message);
      throw new Error(`XAPI lookup failed: ${error.response?.data?.error_message || error.message}`);
    }
  }
}