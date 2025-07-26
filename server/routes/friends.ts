import { Router } from 'express';
import axios from 'axios';

const router = Router();

const OPENXBL_API_KEY = process.env.OPENXBL_API_KEY || '';

// Get friends list
router.get('/api/xbox/friends', async (req, res) => {
  try {
    console.log('🤝 Fetching Xbox friends list...');
    
    const response = await axios.get('https://xbl.io/api/v2/friends', {
      headers: {
        'X-Authorization': OPENXBL_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const friends = response.data.people?.map((friend: any) => ({
      xuid: friend.xuid,
      gamertag: friend.gamertag,
      displayName: friend.displayName,
      gamerscore: friend.gamerScore,
      avatar: friend.displayPicRaw,
      isOnline: friend.presenceState === 'Online',
      currentActivity: friend.presenceText,
      lastSeen: friend.lastSeenDateTimeUtc,
      isFavorite: friend.isFavorite
    })) || [];

    console.log(`✅ Retrieved ${friends.length} friends`);
    
    res.json({
      success: true,
      friends,
      totalCount: friends.length
    });
    
  } catch (error: any) {
    console.error('❌ Failed to fetch friends:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friends list'
    });
  }
});

// Search for players by gamertag
router.post('/api/xbox/search-players', async (req, res) => {
  try {
    const { gamertag } = req.body;
    
    if (!gamertag) {
      return res.status(400).json({
        success: false,
        error: 'Gamertag is required'
      });
    }

    console.log(`🔍 Searching for Xbox players: ${gamertag}`);
    
    const response = await axios.get(`https://xbl.io/api/v2/search/${encodeURIComponent(gamertag)}`, {
      headers: {
        'X-Authorization': OPENXBL_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const players = response.data.people?.map((player: any) => ({
      xuid: player.xuid,
      gamertag: player.gamertag,
      displayName: player.displayName,
      gamerscore: player.gamerScore,
      avatar: player.displayPicRaw,
      isOnline: player.presenceState === 'Online',
      currentActivity: player.presenceText,
      isFollowingCaller: player.isFollowingCaller,
      isFollowedByCaller: player.isFollowedByCaller
    })) || [];

    console.log(`✅ Found ${players.length} players matching: ${gamertag}`);
    
    res.json({
      success: true,
      players,
      searchTerm: gamertag
    });
    
  } catch (error: any) {
    console.error('❌ Failed to search players:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search for players'
    });
  }
});

// Add friend
router.post('/api/xbox/add-friend', async (req, res) => {
  try {
    const { xuid } = req.body;
    
    if (!xuid) {
      return res.status(400).json({
        success: false,
        error: 'XUID is required'
      });
    }

    console.log(`➕ Adding Xbox friend: ${xuid}`);
    
    const response = await axios.post('https://xbl.io/api/v2/friends/add', {
      xuid: xuid
    }, {
      headers: {
        'X-Authorization': OPENXBL_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`✅ Successfully added friend: ${xuid}`);
    
    res.json({
      success: true,
      message: 'Friend added successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Failed to add friend:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to add friend'
    });
  }
});

// Remove friend
router.post('/api/xbox/remove-friend', async (req, res) => {
  try {
    const { xuid } = req.body;
    
    if (!xuid) {
      return res.status(400).json({
        success: false,
        error: 'XUID is required'
      });
    }

    console.log(`➖ Removing Xbox friend: ${xuid}`);
    
    const response = await axios.post('https://xbl.io/api/v2/friends/remove', {
      xuid: xuid
    }, {
      headers: {
        'X-Authorization': OPENXBL_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`✅ Successfully removed friend: ${xuid}`);
    
    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Failed to remove friend:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to remove friend'
    });
  }
});

// Get recent players
router.get('/api/xbox/recent-players', async (req, res) => {
  try {
    console.log('🕒 Fetching recent Xbox players...');
    
    const response = await axios.get('https://xbl.io/api/v2/recent-players', {
      headers: {
        'X-Authorization': OPENXBL_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const recentPlayers = response.data.people?.map((player: any) => ({
      xuid: player.xuid,
      gamertag: player.gamertag,
      displayName: player.displayName,
      gamerscore: player.gamerScore,
      avatar: player.displayPicRaw,
      lastPlayed: player.lastSeenDateTimeUtc,
      gameTitle: player.titleHistory?.[0]?.name || 'Unknown Game'
    })) || [];

    console.log(`✅ Retrieved ${recentPlayers.length} recent players`);
    
    res.json({
      success: true,
      recentPlayers,
      totalCount: recentPlayers.length
    });
    
  } catch (error: any) {
    console.error('❌ Failed to fetch recent players:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent players'
    });
  }
});

export default router;