import { Router } from 'express';
import { XboxActivityService } from '../services/xboxActivityService';
import { XboxGamingService } from '../services/xboxGamingService';
import axios from 'axios';

const router = Router();
const activityService = new XboxActivityService();
const gamingService = new XboxGamingService();

// Get Xbox activity history
router.get('/api/xbox/activity/history', async (req, res) => {
  try {
    console.log('📊 Fetching Xbox activity history');
    const history = await activityService.getActivityHistory();
    res.json(history);
  } catch (error) {
    console.error('❌ Xbox activity history error:', error);
    res.status(500).json({ error: 'Failed to fetch activity history' });
  }
});

// Get Xbox activity feed
router.get('/api/xbox/activity/feed', async (req, res) => {
  try {
    console.log('📡 Fetching Xbox activity feed');
    const feed = await activityService.getActivityFeed();
    res.json({ activities: feed, total: feed.length });
  } catch (error) {
    console.error('❌ Xbox activity feed error:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Get player presence
router.get('/api/xbox/presence/:xuid', async (req, res) => {
  try {
    const { xuid } = req.params;
    console.log(`👀 Fetching presence for XUID: ${xuid}`);
    const presence = await activityService.getPlayerPresence(xuid);
    res.json(presence);
  } catch (error) {
    console.error('❌ Xbox presence error:', error);
    res.status(500).json({ error: 'Failed to fetch player presence' });
  }
});

// Monitor comprehensive player activity
router.get('/api/xbox/monitor/:xuid', async (req, res) => {
  try {
    const { xuid } = req.params;
    console.log(`🎮 Monitoring activity for XUID: ${xuid}`);
    const monitoring = await activityService.monitorPlayerActivity(xuid);
    res.json(monitoring);
  } catch (error) {
    console.error('❌ Xbox monitoring error:', error);
    res.status(500).json({ error: 'Failed to monitor player activity' });
  }
});

// Check what gaming data is available with current subscription
router.get('/api/xbox/gaming-check/:xuid', async (req, res) => {
  try {
    const { xuid } = req.params;
    
    console.log(`🔍 Checking Xbox gaming data availability for XUID: ${xuid}`);
    
    // Test gaming endpoints that provide hours, dates, and games
    const gamingEndpoints = [
      `https://xbl.io/api/v2/player/${xuid}/games`,
      `https://xbl.io/api/v2/player/${xuid}/titles`,
      `https://xbl.io/api/v2/${xuid}/games`,
      `https://xbl.io/api/v2/${xuid}/titles`,
      `https://xbl.io/api/v2/player/${xuid}/gamepass`
    ];
    
    const API_KEY = process.env.OPENXBL_API_KEY;
    
    for (const endpoint of gamingEndpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'X-Authorization': API_KEY,
            'Accept': 'application/json'
          },
          timeout: 8000
        });
        
        if (response.status === 200 && response.data) {
          console.log(`✅ Gaming data available at: ${endpoint}`);
          
          const gameCount = Array.isArray(response.data) ? response.data.length : 
                          response.data.titles?.length || response.data.games?.length || 0;
          
          return res.json({
            available: true,
            endpoint: endpoint.split('/').pop(),
            gameCount,
            message: `Gaming data available! Found ${gameCount} games with hours and dates.`,
            features: ['Hours played per game', 'Last played dates', 'Achievement progress']
          });
        }
      } catch (error: any) {
        const status = error.response?.status;
        console.log(`❌ Endpoint ${endpoint}: Status ${status}`);
        
        if (status === 402) {
          return res.json({
            available: false,
            reason: 'SUBSCRIPTION_UPGRADE_REQUIRED',
            message: 'Gaming data (hours, dates, games) requires OpenXBL Medium plan (~$15-30/month)',
            currentPlan: '$5 Basic Plan',
            currentFeatures: ['Profile data', 'Friends list', 'Activity feed', 'Presence status'],
            upgradeFeatures: ['Games library', 'Hours played per game', 'Last played dates', 'Achievement tracking', 'Gaming statistics'],
            upgradeUrl: 'https://xbl.io/',
            cost: '$15-30/month for Medium plan'
          });
        }
      }
    }
    
    res.json({
      available: false,
      reason: 'NO_GAMING_ENDPOINTS',
      message: 'No gaming data endpoints available. All gaming endpoints return 404 or require subscription upgrade.',
      recommendation: 'Upgrade to OpenXBL Medium plan to access hours played, last played dates, and games library data.'
    });
    
  } catch (error) {
    console.error('❌ Xbox gaming check error:', error);
    res.status(500).json({ error: 'Failed to check gaming data availability' });
  }
});

// Get Xbox gaming data using premium achievements endpoint
router.get('/api/xbox/gaming-data/:xuid', async (req, res) => {
  try {
    const { xuid } = req.params;
    console.log(`🎮 Fetching Xbox gaming data for XUID: ${xuid}`);
    
    const gamingData = await gamingService.getGamingData(xuid);
    res.json(gamingData);
  } catch (error: any) {
    console.error('❌ Xbox gaming data error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Xbox gaming data',
      message: error.message,
      premium: true
    });
  }
});

export default router;