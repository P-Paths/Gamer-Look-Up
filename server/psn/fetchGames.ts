export interface PSNGame {
  npCommunicationId: string;
  trophyTitleName: string;
  trophyTitleDetail: string;
  trophyTitleIconUrl: string;
  trophyTitlePlatform: string[];
  hasTrophyGroups: boolean;
  definedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  earnedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  trophySetVersion: string;
  hiddenFlag: boolean;
  progress: number;
  earnedDateTime?: string;
  lastUpdatedDateTime: string;
  playTime?: string;
  estimatedHours?: number;
}

export interface GamesResult {
  games?: PSNGame[];
  totalItemCount?: number;
  success: boolean;
  error?: string;
}

export async function fetchPSNGames(
  accessToken: string, 
  accountId: string, 
  limit: number = 50,
  offset: number = 0
): Promise<GamesResult> {
  try {
    console.log(`Fetching PlayStation games (limit: ${limit}, offset: ${offset})...`);
    
    const response = await fetch(
      `https://us-tpy.np.community.playstation.net/trophy/v1/users/${accountId}/trophyTitles?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept-Language': 'en-US',
          'User-Agent': 'PlayStation App/24.0.0 (Android/13)'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Access token expired or invalid');
      }
      throw new Error(`Games fetch failed: ${response.status} ${response.statusText}`);
    }

    const gamesData = await response.json();
    
    if (!gamesData.trophyTitles) {
      throw new Error('No games data received');
    }

    // Calculate estimated hours played based on trophy progress
    const gamesWithHours = gamesData.trophyTitles.map((game: any) => {
      const totalTrophies = game.earnedTrophies.platinum + 
                           game.earnedTrophies.gold + 
                           game.earnedTrophies.silver + 
                           game.earnedTrophies.bronze;
      
      // Estimate hours based on trophy count and progress
      // This is an approximation since PlayStation doesn't always provide exact playtime
      let estimatedHours = 0;
      if (totalTrophies > 0) {
        // Rough calculation: platinum = 20-50h, gold = 5-15h, silver = 2-5h, bronze = 0.5-2h
        estimatedHours = (game.earnedTrophies.platinum * 35) +
                        (game.earnedTrophies.gold * 10) +
                        (game.earnedTrophies.silver * 3.5) +
                        (game.earnedTrophies.bronze * 1.25);
        
        // Add base hours for game purchase/installation
        estimatedHours += Math.max(5, game.progress * 0.5);
      } else if (game.progress > 0) {
        // Even if no trophies earned, some playtime if progress > 0
        estimatedHours = Math.max(1, game.progress * 0.1);
      }

      return {
        ...game,
        estimatedHours: Math.round(estimatedHours * 10) / 10 // Round to 1 decimal
      };
    });

    console.log(`Fetched ${gamesWithHours.length} PlayStation games`);
    
    return {
      games: gamesWithHours,
      totalItemCount: gamesData.totalItemCount,
      success: true
    };

  } catch (error) {
    console.error('Games fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Games fetch failed'
    };
  }
}

export async function fetchTopPSNGames(
  accessToken: string, 
  accountId: string, 
  topCount: number = 10
): Promise<GamesResult> {
  try {
    console.log(`Fetching top ${topCount} PlayStation games...`);
    
    // Fetch more games initially to sort by playtime/progress
    const result = await fetchPSNGames(accessToken, accountId, 100, 0);
    
    if (!result.success || !result.games) {
      return result;
    }

    // Sort games by estimated hours (highest first)
    const sortedGames = result.games
      .filter(game => game.estimatedHours && game.estimatedHours > 0)
      .sort((a, b) => (b.estimatedHours || 0) - (a.estimatedHours || 0))
      .slice(0, topCount);

    console.log(`Top ${topCount} games sorted by estimated playtime`);
    
    return {
      games: sortedGames,
      totalItemCount: sortedGames.length,
      success: true
    };

  } catch (error) {
    console.error('Top games fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Top games fetch failed'
    };
  }
}

export async function getGameDetails(
  accessToken: string, 
  accountId: string, 
  npCommunicationId: string
): Promise<any> {
  try {
    console.log(`Fetching details for game: ${npCommunicationId}`);
    
    const response = await fetch(
      `https://us-tpy.np.community.playstation.net/trophy/v1/users/${accountId}/npCommunicationIds/${npCommunicationId}/trophyGroups`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept-Language': 'en-US',
          'User-Agent': 'PlayStation App/24.0.0 (Android/13)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Game details fetch failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Game details fetch error:', error);
    return null;
  }
}

export function formatPlaytime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  } else if (hours < 100) {
    return `${hours.toFixed(1)}h`;
  } else {
    return `${Math.round(hours)}h`;
  }
}

export function calculateTotalPlaytime(games: PSNGame[]): number {
  return games.reduce((total, game) => total + (game.estimatedHours || 0), 0);
}