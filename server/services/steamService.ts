import axios from 'axios';

export interface SteamProfile {
  platform: 'steam';
  steamId: string;
  displayName: string;
  totalGames: number;
  totalHours: number;
  games: Array<{
    name: string;
    hoursPlayed: number;
    lastPlayed?: string;
    isCurrentlyPlaying?: boolean;
  }>;
  lastOnline?: string;
  avatar?: string;
  dataSource: string;
  lastUpdated: string;
}

export class SteamService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.STEAM_API_KEY || process.env.STEAM_WEB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Steam API key not configured');
    }
  }

  /**
   * Get real Steam profile data - only hours, play times, last activity
   */
  async getRealSteamProfile(steamIdOrUsername: string): Promise<SteamProfile | null> {
    if (!this.apiKey) {
      console.log('❌ Steam API key not available');
      return null;
    }

    try {
      console.log(`🎮 Fetching real Steam data for: ${steamIdOrUsername}`);

      let steamId = steamIdOrUsername;

      // If it's a username, resolve to Steam ID
      if (!/^\d{17}$/.test(steamIdOrUsername)) {
        const resolveResponse = await axios.get(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/`, {
          params: {
            key: this.apiKey,
            vanityurl: steamIdOrUsername
          }
        });

        if (resolveResponse.data.response.success !== 1) {
          console.log(`❌ Steam username not found: ${steamIdOrUsername}`);
          return null;
        }

        steamId = resolveResponse.data.response.steamid;
      }

      console.log(`✅ Steam ID resolved: ${steamId}`);

      // Get player summary
      const profileResponse = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`, {
        params: {
          key: this.apiKey,
          steamids: steamId
        }
      });

      const player = profileResponse.data.response.players[0];
      if (!player) {
        console.log(`❌ Steam profile not found for ID: ${steamId}`);
        return null;
      }

      // Get owned games with playtime
      const gamesResponse = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`, {
        params: {
          key: this.apiKey,
          steamid: steamId,
          format: 'json',
          include_appinfo: true,
          include_played_free_games: true
        }
      });

      const gamesData = gamesResponse.data.response.games || [];
      console.log(`✅ Retrieved ${gamesData.length} games for ${player.personaname}`);

      // Process games to get ONLY the data requested: hours, play times, last activity
      const games = gamesData
        .filter((game: any) => game.playtime_forever > 0) // Only games actually played
        .map((game: any) => ({
          name: game.name,
          hoursPlayed: Math.round((game.playtime_forever || 0) / 60), // Convert minutes to hours
          lastPlayed: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : null,
          recentHours: Math.round((game.playtime_2weeks || 0) / 60) // Recent 2-week playtime
        }))
        .sort((a: any, b: any) => new Date(b.lastPlayed || 0).getTime() - new Date(a.lastPlayed || 0).getTime())
        .slice(0, 20); // Top 20 most recently played

      const totalHours = games.reduce((sum, game) => sum + game.hoursPlayed, 0);

      return {
        platform: 'steam',
        steamId,
        displayName: player.personaname,
        totalGames: games.length,
        totalHours,
        games,
        lastOnline: player.lastlogoff ? new Date(player.lastlogoff * 1000).toISOString() : null,
        avatar: player.avatarfull,
        dataSource: 'steam_api_real',
        lastUpdated: new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`❌ Steam API failed for ${steamIdOrUsername}:`, error.response?.status, error.message);
      return null;
    }
  }
}