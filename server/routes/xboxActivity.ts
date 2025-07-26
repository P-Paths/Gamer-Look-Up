import { Router } from 'express';
import { XboxActivityService } from '../services/xboxActivityService';

const router = Router();
const activityService = new XboxActivityService();

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

export default router;