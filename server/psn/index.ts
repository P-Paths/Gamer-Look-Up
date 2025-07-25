import { exchangeNpssoForAccessToken, AuthResult } from './auth';
import { fetchPSNProfile, ProfileResult, getUserAccountId } from './fetchProfile';
import { fetchTopPSNGames, calculateTotalPlaytime, formatPlaytime, GamesResult } from './fetchGames';
import { fetchPSNTrophies, calculateTrophyScore, formatTrophyLevel, getTrophyLevelCategory, TrophiesResult } from './fetchTrophies';
import { getNpssoWithPuppeteer, validateNpssoToken } from './getNpSSO';

export interface PSNData {
  profile: {
    onlineId: string;
    accountId: string;
    avatar: string;
    level: number;
    aboutMe: string;
    country: string;
    isPlus: boolean;
  };
  gaming: {
    totalGames: number;
    totalHours: number;
    topGames: Array<{
      name: string;
      hours: number;
      platform: string[];
      progress: number;
      lastPlayed: string;
    }>;
  };
  trophies: {
    level: number;
    progress: number;
    totalTrophies: number;
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
    trophyScore: number;
    category: string;
  };
  success: boolean;
  error?: string;
}

export async function getCompletePSNData(npsso: string): Promise<PSNData> {
  console.log('🎮 Starting PlayStation data collection...\n');
  
  try {
    // Step 1: Validate NPSSO token
    console.log('1️⃣  Validating NPSSO token...');
    const isValidNpsso = await validateNpssoToken(npsso);
    if (!isValidNpsso) {
      throw new Error('Invalid NPSSO token. Please provide a fresh token from PlayStation.com');
    }
    console.log('✅ NPSSO token is valid\n');

    // Step 2: Exchange NPSSO for access token
    console.log('2️⃣  Exchanging NPSSO for access token...');
    const authResult: AuthResult = await exchangeNpssoForAccessToken(npsso);
    if (!authResult.success || !authResult.tokens) {
      throw new Error(authResult.error || 'Failed to get access token');
    }
    console.log('✅ Access token obtained\n');

    const { accessToken } = authResult.tokens;

    // Step 3: Get account ID
    console.log('3️⃣  Getting account ID...');
    const accountId = await getUserAccountId(accessToken);
    if (!accountId) {
      throw new Error('Failed to get account ID');
    }
    console.log(`✅ Account ID: ${accountId}\n`);

    // Step 4: Fetch profile data
    console.log('4️⃣  Fetching PlayStation profile...');
    const profileResult: ProfileResult = await fetchPSNProfile(accessToken);
    if (!profileResult.success || !profileResult.profile) {
      throw new Error(profileResult.error || 'Failed to fetch profile');
    }
    console.log(`✅ Profile: ${profileResult.profile.onlineId}\n`);

    // Step 5: Fetch trophy data
    console.log('5️⃣  Fetching trophy statistics...');
    const trophiesResult: TrophiesResult = await fetchPSNTrophies(accessToken, accountId);
    if (!trophiesResult.success || !trophiesResult.trophyStats) {
      throw new Error(trophiesResult.error || 'Failed to fetch trophies');
    }
    console.log(`✅ Trophies: Level ${trophiesResult.trophyStats.level}\n`);

    // Step 6: Fetch games data
    console.log('6️⃣  Fetching top games...');
    const gamesResult: GamesResult = await fetchTopPSNGames(accessToken, accountId, 10);
    if (!gamesResult.success || !gamesResult.games) {
      throw new Error(gamesResult.error || 'Failed to fetch games');
    }
    console.log(`✅ Games: ${gamesResult.games.length} top games found\n`);

    // Step 7: Process and format data
    console.log('7️⃣  Processing data...');
    
    const profile = profileResult.profile;
    const trophyStats = trophiesResult.trophyStats;
    const games = gamesResult.games;

    const totalHours = calculateTotalPlaytime(games);
    const trophyScore = calculateTrophyScore(trophyStats.earnedTrophies);
    const trophyCategory = getTrophyLevelCategory(trophyStats.level);

    const topGamesFormatted = games.slice(0, 5).map(game => ({
      name: game.trophyTitleName,
      hours: game.estimatedHours || 0,
      platform: game.trophyTitlePlatform,
      progress: game.progress,
      lastPlayed: game.lastUpdatedDateTime
    }));

    const psnData: PSNData = {
      profile: {
        onlineId: profile.onlineId,
        accountId: profile.accountId,
        avatar: profile.avatarUrls[0]?.avatarUrl || '',
        level: trophyStats.level,
        aboutMe: profile.aboutMe,
        country: profile.country,
        isPlus: profile.isPlus
      },
      gaming: {
        totalGames: games.length,
        totalHours: Math.round(totalHours),
        topGames: topGamesFormatted
      },
      trophies: {
        level: trophyStats.level,
        progress: trophyStats.progress,
        totalTrophies: trophyStats.totalTrophies,
        platinum: trophyStats.earnedTrophies.platinum,
        gold: trophyStats.earnedTrophies.gold,
        silver: trophyStats.earnedTrophies.silver,
        bronze: trophyStats.earnedTrophies.bronze,
        trophyScore,
        category: trophyCategory
      },
      success: true
    };

    console.log('✅ Data processing complete\n');
    return psnData;

  } catch (error) {
    console.error('❌ PlayStation data collection failed:', error);
    return {
      profile: { onlineId: '', accountId: '', avatar: '', level: 0, aboutMe: '', country: '', isPlus: false },
      gaming: { totalGames: 0, totalHours: 0, topGames: [] },
      trophies: { level: 0, progress: 0, totalTrophies: 0, platinum: 0, gold: 0, silver: 0, bronze: 0, trophyScore: 0, category: '' },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export function displayPSNData(data: PSNData): void {
  if (!data.success) {
    console.log('❌ Failed to retrieve PlayStation data');
    console.log(`Error: ${data.error}`);
    return;
  }

  console.log('🎮 PLAYSTATION GAMING PROFILE');
  console.log('================================\n');

  // Profile Section
  console.log('👤 PROFILE');
  console.log(`Online ID: ${data.profile.onlineId}`);
  console.log(`Account ID: ${data.profile.accountId}`);
  console.log(`Trophy Level: ${data.profile.level}`);
  console.log(`Country: ${data.profile.country || 'Not specified'}`);
  console.log(`PlayStation Plus: ${data.profile.isPlus ? 'Yes' : 'No'}`);
  if (data.profile.aboutMe) {
    console.log(`About: ${data.profile.aboutMe}`);
  }
  console.log();

  // Gaming Section
  console.log('🎯 GAMING STATISTICS');
  console.log(`Total Games: ${data.gaming.totalGames}`);
  console.log(`Estimated Total Hours: ${formatPlaytime(data.gaming.totalHours)}`);
  console.log();

  // Top Games
  console.log('🏆 TOP GAMES');
  data.gaming.topGames.forEach((game, index) => {
    const platforms = game.platform.join(', ');
    const lastPlayed = new Date(game.lastPlayed).toLocaleDateString();
    console.log(`${index + 1}. ${game.name}`);
    console.log(`   Hours: ${formatPlaytime(game.hours)} | Progress: ${game.progress}% | Platform: ${platforms}`);
    console.log(`   Last Played: ${lastPlayed}`);
  });
  console.log();

  // Trophy Section
  console.log('🏅 TROPHY STATISTICS');
  console.log(`Trophy Level: ${formatTrophyLevel(data.trophies.level, data.trophies.progress)}`);
  console.log(`Category: ${data.trophies.category}`);
  console.log(`Total Trophies: ${data.trophies.totalTrophies}`);
  console.log(`  🥇 Platinum: ${data.trophies.platinum}`);
  console.log(`  🥇 Gold: ${data.trophies.gold}`);
  console.log(`  🥈 Silver: ${data.trophies.silver}`);
  console.log(`  🥉 Bronze: ${data.trophies.bronze}`);
  console.log(`Trophy Score: ${data.trophies.trophyScore.toLocaleString()} points`);
  console.log();

  console.log('================================');
  console.log('✅ PlayStation data retrieval complete!');
}

// Export individual functions for modular use
export {
  exchangeNpssoForAccessToken,
  fetchPSNProfile,
  fetchTopPSNGames,
  fetchPSNTrophies,
  getNpssoWithPuppeteer,
  validateNpssoToken
};