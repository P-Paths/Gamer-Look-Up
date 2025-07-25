export interface TrophyStats {
  level: number;
  progress: number;
  totalTrophies: number;
  earnedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  hiddenTrophies: number;
  trophiesInProgress: number;
}

export interface TrophySummary {
  level: number;
  progress: number;
  earnedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  definedTrophies?: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  hiddenFlag?: boolean;
}

export interface TrophiesResult {
  trophyStats?: TrophyStats;
  success: boolean;
  error?: string;
}

export async function fetchPSNTrophies(accessToken: string, accountId: string): Promise<TrophiesResult> {
  try {
    console.log('Fetching PlayStation trophy summary...');
    
    const response = await fetch(
      `https://us-tpy.np.community.playstation.net/trophy/v1/users/${accountId}/trophySummary`,
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
      throw new Error(`Trophy fetch failed: ${response.status} ${response.statusText}`);
    }

    const trophyData = await response.json();
    
    if (!trophyData.trophySummary) {
      throw new Error('No trophy data received');
    }

    const summary = trophyData.trophySummary;
    const totalEarned = summary.earnedTrophies.platinum + 
                       summary.earnedTrophies.gold + 
                       summary.earnedTrophies.silver + 
                       summary.earnedTrophies.bronze;

    console.log(`Trophy summary fetched: Level ${summary.level}, ${totalEarned} total trophies`);
    
    return {
      trophyStats: {
        level: summary.level,
        progress: summary.progress,
        totalTrophies: totalEarned,
        earnedTrophies: {
          platinum: summary.earnedTrophies.platinum,
          gold: summary.earnedTrophies.gold,
          silver: summary.earnedTrophies.silver,
          bronze: summary.earnedTrophies.bronze
        },
        hiddenTrophies: 0, // API doesn't provide this directly
        trophiesInProgress: 0 // Would need to calculate from individual games
      },
      success: true
    };

  } catch (error) {
    console.error('Trophy fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Trophy fetch failed'
    };
  }
}

export async function fetchRecentTrophies(
  accessToken: string, 
  accountId: string, 
  limit: number = 10
): Promise<any[]> {
  try {
    console.log(`Fetching ${limit} recent trophies...`);
    
    const response = await fetch(
      `https://us-tpy.np.community.playstation.net/trophy/v1/users/${accountId}/trophies?limit=${limit}&offset=0&orderBy=date`,
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
      throw new Error(`Recent trophies fetch failed: ${response.status} ${response.statusText}`);
    }

    const trophyData = await response.json();
    return trophyData.trophies || [];

  } catch (error) {
    console.error('Recent trophies fetch error:', error);
    return [];
  }
}

export async function getTrophyRarity(
  accessToken: string, 
  npCommunicationId: string, 
  trophyGroupId: string, 
  trophyId: string
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://us-tpy.np.community.playstation.net/trophy/v1/npCommunicationIds/${npCommunicationId}/trophyGroups/${trophyGroupId}/trophies/${trophyId}`,
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
      return null;
    }

    const trophyData = await response.json();
    return trophyData.trophy?.trophyRare || null;

  } catch (error) {
    console.error('Trophy rarity fetch error:', error);
    return null;
  }
}

export function calculateTrophyScore(earnedTrophies: TrophySummary['earnedTrophies']): number {
  // PlayStation trophy scoring system approximation
  // Platinum = 180 points, Gold = 90 points, Silver = 30 points, Bronze = 15 points
  return (earnedTrophies.platinum * 180) +
         (earnedTrophies.gold * 90) +
         (earnedTrophies.silver * 30) +
         (earnedTrophies.bronze * 15);
}

export function formatTrophyLevel(level: number, progress: number): string {
  return `Level ${level} (${progress}% to next level)`;
}

export function getTrophyLevelCategory(level: number): string {
  if (level >= 1000) return 'Legend';
  if (level >= 500) return 'Master';
  if (level >= 200) return 'Expert';
  if (level >= 100) return 'Veteran';
  if (level >= 50) return 'Experienced';
  if (level >= 25) return 'Intermediate';
  if (level >= 10) return 'Novice';
  return 'Beginner';
}

export function getRareTrophyCount(earnedTrophies: TrophySummary['earnedTrophies']): number {
  // Estimate rare trophies (Gold + Platinum are generally rarer)
  return earnedTrophies.platinum + earnedTrophies.gold;
}