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
   * Get comprehensive gaming data from achievements endpoint
   * Premium OpenXBL subscription provides data through achievements
   */
  async getGamingData(xuid: string): Promise<XboxGamingData | null> {
    if (!this.apiKey) {
      throw new Error('OPENXBL_API_KEY required for gaming data');
    }

    console.log(`🎮 Fetching Xbox gaming data from achievements for XUID: ${xuid}`);
    
    try {
      // Premium OpenXBL provides gaming data through achievements endpoint
      const response = await axios.get(`https://xbl.io/api/v2/achievements/player/${xuid}`, {
        headers: {
          'X-Authorization': this.apiKey,
          'Accept': 'application/json',
          'Accept-Language': 'en-US'
        },
        timeout: 15000
      });

      if (response.status === 200 && response.data) {
        console.log(`✅ Premium gaming data retrieved from achievements endpoint`);
        return this.parseAchievementGamingData(response.data, xuid);
      }

      throw new Error('GAMING_DATA_UNAVAILABLE: Unable to fetch gaming data from achievements endpoint');

    } catch (error: any) {
      const status = error.response?.status;
      
      if (status === 402) {
        throw new Error('SUBSCRIPTION_UPGRADE_REQUIRED: Gaming data requires OpenXBL premium subscription');
      } else if (status === 403) {
        throw new Error('ACCESS_FORBIDDEN: Premium subscription may not be activated yet');
      } else if (status === 404) {
        throw new Error('ENDPOINT_NOT_FOUND: Achievement endpoint not available');
      }
      
      console.error(`❌ Xbox gaming data fetch failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse gaming data from achievements API response
   */
  private parseAchievementGamingData(data: any, xuid: string): XboxGamingData {
    const games: XboxGame[] = [];
    let totalHours = 0;
    let totalGamerscore = 0;

    // Parse games from achievements data - handle the correct structure
    const gamesList = data.titles || [];
    
    if (gamesList.length === 0) {
      console.log('⚠️ No game titles found in achievements data');
      console.log('Data structure:', Object.keys(data));
    } else {
      console.log(`✅ Found ${gamesList.length} games in achievements data`);
    }
    
    gamesList.forEach((title: any, index: number) => {
      // Extract gaming data from achievement info
      const currentScore = title.currentGamerscore || title.gamerscore || 0;
      const maxScore = title.maxGamerscore || title.maxPossibleGamerscore || 1000; // Default estimate
      const achievementCount = title.achievements?.length || 0;
      
      // Log first few games for debugging
      if (index < 3) {
        console.log(`Game ${index + 1}: ${title.name} - Score: ${currentScore}/${maxScore}, Achievements: ${achievementCount}`);
      }
      
      // Calculate estimated hours from achievement activity and score progression
      const hoursPlayed = this.estimateHoursFromGameData(title, currentScore, maxScore);
      totalHours += hoursPlayed;
      totalGamerscore += currentScore;
      
      // Find last activity date from achievements or estimate from score
      const lastPlayed = this.findLastActivityDate(title) || this.estimateLastPlayedDate(title);
      
      games.push({
        id: title.titleId || `title_${index}`,
        name: title.name || title.displayName || 'Unknown Game',
        hoursPlayed,
        lastPlayed,
        currentlyPlaying: false, // Can't determine from achievements alone
        achievementsUnlocked: title.achievements?.filter((a: any) => a.progressState === 'Unlocked').length || 0,
        totalAchievements: achievementCount,
        gamerscore: currentScore,
        percentComplete: maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0
      });
    });

    // Sort games by last played date (most recent first)
    games.sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime());

    return {
      player: {
        xuid,
        gamertag: data.gamertag || 'Unknown',
        totalHours,
        totalGames: games.length,
        gamerscore: totalGamerscore
      },
      games,
      lastActivity: games[0]?.lastPlayed || new Date().toISOString(),
      dataSource: 'OpenXBL-Premium'
    };
  }

  /**
   * Estimate hours played from game data (achievements + gamerscore)
   */
  private estimateHoursFromGameData(title: any, currentScore: number, maxScore: number): number {
    // Multiple estimation methods for better accuracy
    
    // Method 1: Achievement-based estimation
    let achievementHours = 0;
    if (title.achievements && title.achievements.length > 0) {
      const unlockedAchievements = title.achievements.filter((a: any) => a.progressState === 'Unlocked');
      const achievementCount = unlockedAchievements.length;
      achievementHours = Math.min(achievementCount * 1.5, 80); // 1.5 hours per achievement, max 80
    }
    
    // Method 2: Gamerscore-based estimation
    let scoreHours = 0;
    if (currentScore > 0 && maxScore > 0) {
      const completionRatio = Math.min(currentScore / maxScore, 1);
      // Games typically take 10-50 hours to fully complete
      const estimatedFullHours = Math.min(maxScore / 20, 50); // Rough estimate: 20 gamerscore per hour
      scoreHours = Math.round(estimatedFullHours * completionRatio);
    }
    
    // Method 3: Basic engagement estimation
    let engagementHours = 0;
    if (currentScore > 0) {
      // Minimum engagement time based on having any progress
      engagementHours = Math.max(Math.round(currentScore / 100), 1);
    }
    
    // Use the highest reasonable estimate
    const finalHours = Math.max(achievementHours, scoreHours, engagementHours);
    return Math.min(finalHours, 200); // Cap at 200 hours to avoid unrealistic estimates
  }

  /**
   * Estimate last played date when achievement data is unavailable
   */
  private estimateLastPlayedDate(title: any): string {
    // If we have gamerscore progress, assume recent activity (within last year)
    if ((title.currentGamerscore || title.gamerscore || 0) > 0) {
      // Rough estimate: more recent for higher scores
      const daysAgo = Math.max(1, Math.min(365, 180 - (title.currentGamerscore || 0) / 10));
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() - daysAgo);
      return estimatedDate.toISOString();
    }
    
    return 'Unknown';
  }

  /**
   * Find last activity date from achievement unlock dates
   */
  private findLastActivityDate(title: any): string {
    if (!title.achievements) return 'Unknown';
    
    const unlockedAchievements = title.achievements
      .filter((a: any) => a.progressState === 'Unlocked' && (a.timeUnlocked || a.dateTimeUnlocked))
      .map((a: any) => new Date(a.timeUnlocked || a.dateTimeUnlocked))
      .sort((a: Date, b: Date) => b.getTime() - a.getTime());
    
    if (unlockedAchievements.length > 0) {
      return unlockedAchievements[0].toISOString();
    }
    
    return 'Unknown';
  }

  /**
   * Parse gaming data from traditional API response (legacy method)
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