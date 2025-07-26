/**
 * Xbox Gaming Service - Optimized for getting hours, dates, and games data
 * Designed to work with upgraded OpenXBL subscription or alternative APIs
 */

import axios from 'axios';

export interface XboxGame {
  id: string;
  name: string;
  hoursPlayed: number;
  lastPlayed: string;
  currentlyPlaying: boolean;
  achievementsUnlocked: number;
  totalAchievements: number;
  gamerscore: number;
  percentComplete: number;
}

export interface XboxGamingData {
  player: {
    xuid: string;
    gamertag: string;
    totalHours: number;
    totalGames: number;
    gamerscore: number;
  };
  games: XboxGame[];
  lastActivity: string;
  dataSource: 'OpenXBL-Premium' | 'XAPI' | 'Microsoft-Official';
}

export class XboxGamingService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENXBL_API_KEY || '';
  }

  /**
   * Get comprehensive gaming data - hours, dates, games
   * Requires upgraded OpenXBL subscription
   */
  async getGamingData(xuid: string): Promise<XboxGamingData | null> {
    if (!this.apiKey) {
      throw new Error('OPENXBL_API_KEY required for gaming data');
    }

    console.log(`🎮 Attempting to fetch Xbox gaming data for XUID: ${xuid}`);
    
    try {
      // Try multiple gaming endpoints
      const endpoints = [
        `/api/v2/player/${xuid}/games`,
        `/api/v2/player/${xuid}/titles`, 
        `/api/v2/player/${xuid}/gamepass`,
        `/api/v2/${xuid}/games`,
        `/api/v2/${xuid}/titles`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Testing endpoint: ${endpoint}`);
          
          const response = await axios.get(`https://xbl.io${endpoint}`, {
            headers: {
              'X-Authorization': this.apiKey,
              'Accept': 'application/json'
            },
            timeout: 10000
          });

          if (response.status === 200 && response.data) {
            console.log(`✅ Success with endpoint: ${endpoint}`);
            return this.parseGamingData(response.data, xuid);
          }

        } catch (endpointError: any) {
          const status = endpointError.response?.status;
          
          if (status === 402) {
            throw new Error('SUBSCRIPTION_UPGRADE_REQUIRED: Gaming data requires OpenXBL Medium plan (~$15-30/month)');
          } else if (status === 403) {
            console.log(`❌ Forbidden: ${endpoint} - Need subscription upgrade`);
          } else if (status === 404) {
            console.log(`❌ Not found: ${endpoint} - Endpoint not available`);
          } else {
            console.log(`❌ Error ${status}: ${endpoint}`);
          }
        }
      }

      // If all endpoints fail, provide upgrade guidance
      throw new Error('GAMING_DATA_UNAVAILABLE: Your $5 OpenXBL plan includes profile data only. Upgrade to Medium plan for gaming hours, dates, and library data.');

    } catch (error: any) {
      console.error(`❌ Xbox gaming data fetch failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse gaming data from API response
   */
  private parseGamingData(data: any, xuid: string): XboxGamingData {
    const games: XboxGame[] = [];
    let totalHours = 0;

    // Parse games from various possible response formats
    const gamesList = data.titles || data.games || data.ownedGames || [];
    
    gamesList.forEach((game: any, index: number) => {
      const hoursPlayed = this.extractHours(game);
      totalHours += hoursPlayed;

      games.push({
        id: game.titleId || game.id || `game_${index}`,
        name: game.name || game.titleName || game.displayName || 'Unknown Game',
        hoursPlayed,
        lastPlayed: game.lastPlayed || game.lastTimePlayed || 'Unknown',
        currentlyPlaying: game.isCurrentlyPlaying || false,
        achievementsUnlocked: game.achievementsUnlocked || 0,
        totalAchievements: game.totalAchievements || 0,
        gamerscore: game.currentGamerscore || 0,
        percentComplete: game.percentComplete || 0
      });
    });

    return {
      player: {
        xuid,
        gamertag: data.gamertag || 'Unknown',
        totalHours,
        totalGames: games.length,
        gamerscore: data.gamerscore || 0
      },
      games: games.sort((a, b) => b.hoursPlayed - a.hoursPlayed), // Sort by hours played
      lastActivity: data.lastActivity || new Date().toISOString(),
      dataSource: 'OpenXBL-Premium'
    };
  }

  /**
   * Extract hours played from various game data formats
   */
  private extractHours(game: any): number {
    // Try different possible hour fields
    if (game.hoursPlayed) return game.hoursPlayed;
    if (game.timePlayed) return game.timePlayed;
    if (game.minutesPlayed) return Math.round(game.minutesPlayed / 60);
    if (game.playtimeStats?.totalPlayTime) return Math.round(game.playtimeStats.totalPlayTime / 3600);
    
    // Estimate from achievements or progress if available
    if (game.currentGamerscore && game.maxGamerscore) {
      const progress = game.currentGamerscore / game.maxGamerscore;
      return Math.round(progress * 50); // Rough estimate
    }
    
    return 0;
  }

  /**
   * Check if gaming data is available with current subscription
   */
  async checkGamingDataAvailability(xuid: string): Promise<{
    available: boolean;
    reason: string;
    upgradeRequired: boolean;
    subscriptionLevel: string;
  }> {
    try {
      await this.getGamingData(xuid);
      return {
        available: true,
        reason: 'Gaming data accessible',
        upgradeRequired: false,
        subscriptionLevel: 'Premium'
      };
    } catch (error: any) {
      if (error.message.includes('SUBSCRIPTION_UPGRADE_REQUIRED')) {
        return {
          available: false,
          reason: 'Gaming data requires OpenXBL Medium plan (~$15-30/month)',
          upgradeRequired: true,
          subscriptionLevel: 'Basic ($5)'
        };
      }

      return {
        available: false,
        reason: error.message,
        upgradeRequired: true,
        subscriptionLevel: 'Unknown'
      };
    }
  }
}