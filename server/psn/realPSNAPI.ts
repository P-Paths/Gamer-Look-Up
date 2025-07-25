/**
 * Real PlayStation Network API Integration
 * Uses the official unofficial psn-api library for authentic PSN data
 */

import { 
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getUserTrophyProfileSummary,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  getTitleTrophies,
  makeUniversalSearch
} from 'psn-api';

interface PSNCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface PSNUserProfile {
  onlineId: string;
  accountId: string;
  displayName: string;
  avatarUrls: {
    size: string;
    url: string;
  }[];
  trophyLevel: number;
  trophyProgress: number;
  totalTrophies: number;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
}

interface PSNGameData {
  name: string;
  npCommunicationId: string;
  platform: string;
  hoursPlayed: number;
  lastPlayed?: string;
  imageUrl?: string;
  trophiesEarned: number;
  totalTrophies: number;
  completionPercentage: number;
}

class RealPSNAPI {
  private credentials: PSNCredentials | null = null;

  async authenticate(npsso: string): Promise<PSNCredentials> {
    try {
      console.log('🔐 Authenticating with PlayStation Network...');
      
      // Exchange NPSSO for access code
      const accessCode = await exchangeNpssoForAccessCode(npsso);
      console.log('✅ Got access code');
      
      // Exchange access code for auth tokens
      const authTokens = await exchangeAccessCodeForAuthTokens(accessCode);
      console.log('✅ Got auth tokens');
      
      this.credentials = {
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        expiresAt: Date.now() + (authTokens.expiresIn * 1000)
      };

      return this.credentials;
    } catch (error) {
      console.error('❌ PSN Authentication failed:', error);
      throw new Error(`PSN authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserProfile(accountId: string = 'me'): Promise<PSNUserProfile> {
    if (!this.credentials || Date.now() > this.credentials.expiresAt) {
      throw new Error('PSN credentials expired. Please re-authenticate.');
    }

    try {
      console.log('👤 Fetching user profile...');
      
      const profile = await getUserTrophyProfileSummary(
        { accessToken: this.credentials.accessToken },
        accountId
      );

      const totalTrophies = profile.earnedTrophies.bronze + 
                           profile.earnedTrophies.silver + 
                           profile.earnedTrophies.gold + 
                           profile.earnedTrophies.platinum;

      return {
        onlineId: (profile as any).onlineId || 'Unknown',
        accountId: profile.accountId,
        displayName: (profile as any).onlineId || 'Unknown',
        avatarUrls: (profile as any).avatarUrls || [],
        trophyLevel: profile.trophyLevel,
        trophyProgress: profile.progress,
        totalTrophies,
        platinum: profile.earnedTrophies.platinum,
        gold: profile.earnedTrophies.gold,
        silver: profile.earnedTrophies.silver,
        bronze: profile.earnedTrophies.bronze
      };
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserGames(accountId: string = 'me', limit: number = 20): Promise<PSNGameData[]> {
    if (!this.credentials || Date.now() > this.credentials.expiresAt) {
      throw new Error('PSN credentials expired. Please re-authenticate.');
    }

    try {
      console.log('🎮 Fetching user games...');
      
      const titlesResponse = await getUserTitles(
        { accessToken: this.credentials.accessToken },
        accountId,
        { limit }
      );

      const games: PSNGameData[] = [];

      for (const title of titlesResponse.trophyTitles.slice(0, limit)) {
        const totalTrophies = title.definedTrophies.bronze + 
                             title.definedTrophies.silver + 
                             title.definedTrophies.gold + 
                             title.definedTrophies.platinum;

        const earnedTrophies = title.earnedTrophies.bronze + 
                              title.earnedTrophies.silver + 
                              title.earnedTrophies.gold + 
                              title.earnedTrophies.platinum;

        const completionPercentage = totalTrophies > 0 ? 
          Math.round((earnedTrophies / totalTrophies) * 100) : 0;

        // Estimate playtime based on trophy completion and game complexity
        const estimatedHours = this.estimatePlaytime(
          completionPercentage, 
          totalTrophies, 
          title.trophyTitlePlatform
        );

        games.push({
          name: title.trophyTitleName,
          npCommunicationId: title.npCommunicationId || '',
          platform: title.trophyTitlePlatform || 'PS4',
          hoursPlayed: estimatedHours,
          lastPlayed: title.lastUpdatedDateTime || undefined,
          imageUrl: title.trophyTitleIconUrl || undefined,
          trophiesEarned: earnedTrophies,
          totalTrophies: totalTrophies,
          completionPercentage
        });
      }

      console.log(`✅ Fetched ${games.length} games`);
      return games;
    } catch (error) {
      console.error('❌ Failed to fetch user games:', error);
      throw new Error(`Failed to fetch user games: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchUser(onlineId: string): Promise<any> {
    if (!this.credentials || Date.now() > this.credentials.expiresAt) {
      throw new Error('PSN credentials expired. Please re-authenticate.');
    }

    try {
      console.log(`🔍 Searching for user: ${onlineId}`);
      
      const searchResults = await makeUniversalSearch(
        { accessToken: this.credentials.accessToken },
        onlineId,
        'SocialAllAccounts'
      );

      if (searchResults.domainResponses.length === 0) {
        throw new Error(`User "${onlineId}" not found`);
      }

      const userResult = searchResults.domainResponses[0].results.find(
        (result: any) => result.socialMetadata?.onlineId?.toLowerCase() === onlineId.toLowerCase()
      );

      if (!userResult) {
        throw new Error(`User "${onlineId}" not found`);
      }

      return {
        accountId: userResult.socialMetadata.accountId,
        onlineId: userResult.socialMetadata.onlineId,
        avatarUrl: userResult.socialMetadata.avatarUrl
      };
    } catch (error) {
      console.error('❌ User search failed:', error);
      throw new Error(`User search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private estimatePlaytime(completionPercentage: number, totalTrophies: number, platform: string): number {
    // Base hours estimation algorithm
    let baseHours = 10; // Minimum game engagement
    
    // Platform multipliers
    const platformMultipliers: { [key: string]: number } = {
      'PS5': 1.2,
      'PS4': 1.0,
      'PS3': 0.8,
      'PSVITA': 0.6
    };

    const multiplier = platformMultipliers[platform] || 1.0;
    
    // Trophy complexity factor
    const trophyFactor = Math.min(totalTrophies / 20, 3); // Cap at 3x multiplier
    
    // Completion time estimation
    const completionFactor = Math.pow(completionPercentage / 100, 0.7); // Logarithmic scaling
    
    const estimatedHours = Math.round(baseHours * multiplier * trophyFactor * completionFactor);
    
    return Math.max(estimatedHours, completionPercentage > 0 ? 1 : 0);
  }

  async getComprehensiveUserData(gamerTag: string): Promise<{
    profile: PSNUserProfile;
    games: PSNGameData[];
    totalHours: number;
    totalGames: number;
    avgHoursPerGame: number;
  }> {
    try {
      // First search for the user to get their account ID
      const searchResult = await this.searchUser(gamerTag);
      
      // Get profile and games data
      const [profile, games] = await Promise.all([
        this.getUserProfile(searchResult.accountId),
        this.getUserGames(searchResult.accountId, 50)
      ]);

      const totalHours = games.reduce((sum, game) => sum + game.hoursPlayed, 0);
      const totalGames = games.length;
      const avgHoursPerGame = totalGames > 0 ? Math.round(totalHours / totalGames) : 0;

      return {
        profile,
        games,
        totalHours,
        totalGames,
        avgHoursPerGame
      };
    } catch (error) {
      console.error('❌ Failed to get comprehensive user data:', error);
      throw error;
    }
  }
}

export { RealPSNAPI, type PSNCredentials, type PSNUserProfile, type PSNGameData };