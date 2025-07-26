import { Router } from 'express';
import axios from 'axios';

const router = Router();

const OPENXBL_API_KEY = process.env.OPENXBL_API_KEY || '';

// Get detailed player stats by gamertag
router.post('/api/xbox/player-stats', async (req, res) => {
  try {
    const { gamertag } = req.body;
    
    if (!gamertag) {
      return res.status(400).json({
        success: false,
        error: 'Gamertag is required'
      });
    }

    console.log(`📊 Fetching detailed stats for: ${gamertag}`);
    
    // First get player profile
    const profileResponse = await axios.get(`https://xbl.io/api/v2/search/${encodeURIComponent(gamertag)}`, {
      headers: {
        'X-Authorization': OPENXBL_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (!profileResponse.data?.people?.[0]) {
      return res.status(404).json({
        success: false,
        error: 'Xbox player not found'
      });
    }

    const player = profileResponse.data.people[0];
    
    // Get detailed player summary
    let playerSummary = null;
    try {
      const summaryResponse = await axios.get(`https://xbl.io/api/v2/player/summary/${player.xuid}`, {
        headers: {
          'X-Authorization': OPENXBL_API_KEY,
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      playerSummary = summaryResponse.data;
    } catch (error) {
      console.log('Player summary not available');
    }

    // Get title history (games played)
    let titleHistory = [];
    try {
      const historyResponse = await axios.get(`https://xbl.io/api/v2/player/titleHistory/${player.xuid}`, {
        headers: {
          'X-Authorization': OPENXBL_API_KEY,
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      if (historyResponse.data?.titles) {
        titleHistory = historyResponse.data.titles.slice(0, 15).map((game: any) => ({
          name: game.name,
          titleId: game.titleId,
          lastTimePlayed: game.lastTimePlayed,
          visible: game.visible,
          canShowPresence: game.canShowPresence,
          achievement: game.achievement || {},
          stats: game.stats || {}
        }));
      }
    } catch (error) {
      console.log('Title history not available with current subscription');
    }

    // Get achievement stats for top games
    let achievementStats = [];
    if (titleHistory.length > 0) {
      for (const game of titleHistory.slice(0, 5)) {
        try {
          const achievementResponse = await axios.get(`https://xbl.io/api/v2/achievements/player/${player.xuid}/${game.titleId}`, {
            headers: {
              'X-Authorization': OPENXBL_API_KEY,
              'Accept': 'application/json'
            },
            timeout: 8000
          });
          
          if (achievementResponse.data) {
            achievementStats.push({
              gameName: game.name,
              titleId: game.titleId,
              achievements: achievementResponse.data
            });
          }
        } catch (error) {
          // Achievement details may not be available
        }
      }
    }

    const playerStats = {
      profile: {
        xuid: player.xuid,
        gamertag: player.gamertag,
        displayName: player.displayName,
        gamerscore: parseInt(player.gamerScore) || 0,
        avatar: player.displayPicRaw,
        isOnline: player.presenceState === 'Online',
        currentActivity: player.presenceText,
        lastSeen: player.lastSeenDateTimeUtc,
        accountTier: player.accountTier || 'Unknown',
        reputation: player.xboxOneRep || 'Unknown'
      },
      summary: playerSummary,
      recentGames: titleHistory,
      achievementHighlights: achievementStats,
      stats: {
        totalGames: titleHistory.length,
        totalAchievements: achievementStats.reduce((sum, game) => sum + (game.achievements?.length || 0), 0),
        gamerscore: parseInt(player.gamerScore) || 0
      }
    };

    console.log(`✅ Retrieved detailed stats for ${gamertag}: ${titleHistory.length} games`);
    
    res.json({
      success: true,
      playerStats,
      dataSource: 'openxbl_api'
    });
    
  } catch (error: any) {
    console.error('❌ Failed to fetch player stats:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player statistics'
    });
  }
});

// Get specific game achievements for a player
router.post('/api/xbox/game-achievements', async (req, res) => {
  try {
    const { gamertag, titleId } = req.body;
    
    if (!gamertag || !titleId) {
      return res.status(400).json({
        success: false,
        error: 'Gamertag and titleId are required'
      });
    }

    console.log(`🏆 Fetching achievements for ${gamertag} in game ${titleId}`);
    
    // First get player profile to get XUID
    const profileResponse = await axios.get(`https://xbl.io/api/v2/search/${encodeURIComponent(gamertag)}`, {
      headers: {
        'X-Authorization': OPENXBL_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (!profileResponse.data?.people?.[0]) {
      return res.status(404).json({
        success: false,
        error: 'Xbox player not found'
      });
    }

    const player = profileResponse.data.people[0];
    
    // Get achievements for specific game
    const achievementResponse = await axios.get(`https://xbl.io/api/v2/achievements/player/${player.xuid}/${titleId}`, {
      headers: {
        'X-Authorization': OPENXBL_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    const achievements = achievementResponse.data?.achievements || [];
    const gameStats = {
      player: {
        gamertag: player.gamertag,
        gamerscore: player.gamerScore
      },
      game: {
        titleId: titleId,
        totalAchievements: achievements.length,
        unlockedAchievements: achievements.filter((a: any) => a.progressState === 'Achieved').length,
        gamerscore: achievements.reduce((sum: number, a: any) => sum + (a.rewards?.[0]?.value || 0), 0)
      },
      achievements: achievements.map((achievement: any) => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        isUnlocked: achievement.progressState === 'Achieved',
        unlockedDate: achievement.progression?.timeUnlocked,
        gamerscore: achievement.rewards?.[0]?.value || 0,
        rarity: achievement.rarity || {},
        mediaAssets: achievement.mediaAssets || []
      }))
    };

    console.log(`✅ Retrieved ${achievements.length} achievements for ${gamertag}`);
    
    res.json({
      success: true,
      gameStats,
      dataSource: 'openxbl_api'
    });
    
  } catch (error: any) {
    console.error('❌ Failed to fetch game achievements:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game achievements'
    });
  }
});

// Compare two players' stats
router.post('/api/xbox/compare-players', async (req, res) => {
  try {
    const { gamertag1, gamertag2 } = req.body;
    
    if (!gamertag1 || !gamertag2) {
      return res.status(400).json({
        success: false,
        error: 'Both gamertags are required'
      });
    }

    console.log(`⚖️ Comparing ${gamertag1} vs ${gamertag2}`);
    
    // Get both players' data
    const [player1Response, player2Response] = await Promise.all([
      fetch(`/api/xbox/player-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamertag: gamertag1 })
      }),
      fetch(`/api/xbox/player-stats`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamertag: gamertag2 })
      })
    ]);

    const [player1Data, player2Data] = await Promise.all([
      player1Response.json(),
      player2Response.json()
    ]);

    if (!player1Data.success || !player2Data.success) {
      return res.status(404).json({
        success: false,
        error: 'One or both players not found'
      });
    }

    const comparison = {
      player1: player1Data.playerStats,
      player2: player2Data.playerStats,
      comparison: {
        gamerscoreWinner: player1Data.playerStats.profile.gamerscore > player2Data.playerStats.profile.gamerscore ? gamertag1 : gamertag2,
        gamerscoreDifference: Math.abs(player1Data.playerStats.profile.gamerscore - player2Data.playerStats.profile.gamerscore),
        gamesPlayedWinner: player1Data.playerStats.stats.totalGames > player2Data.playerStats.stats.totalGames ? gamertag1 : gamertag2,
        gamesPlayedDifference: Math.abs(player1Data.playerStats.stats.totalGames - player2Data.playerStats.stats.totalGames)
      }
    };

    console.log(`✅ Compared ${gamertag1} vs ${gamertag2}`);
    
    res.json({
      success: true,
      comparison,
      dataSource: 'openxbl_api'
    });
    
  } catch (error: any) {
    console.error('❌ Failed to compare players:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to compare players'
    });
  }
});

export default router;