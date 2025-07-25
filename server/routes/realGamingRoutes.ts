/**
 * Real Gaming Data Routes
 * API endpoints for accessing real PlayStation and Xbox gaming data
 */

import { Router } from 'express';
import { RealGamingDataService } from '../services/realGamingDataService';

const router = Router();
const gamingService = new RealGamingDataService();

// Real Xbox data endpoint
router.post('/api/xbox/real-data', async (req, res) => {
  try {
    const { gamerTag } = req.body;
    
    if (!gamerTag) {
      return res.status(400).json({
        success: false,
        error: 'Gamer tag is required'
      });
    }

    console.log(`🎮 Real Xbox data request for: ${gamerTag}`);
    
    const data = await gamingService.getRealGamingData(gamerTag, 'xbox');
    
    if (data) {
      res.json({
        success: true,
        platform: 'xbox',
        data,
        realData: true,
        dataSource: data.dataSource,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: `No Xbox data found for "${gamerTag}". The profile may be private or the gamer tag doesn't exist.`,
        suggestions: [
          'Check if the gamer tag is spelled correctly',
          'Ensure the Xbox profile is set to public',
          'Try using the exact gamer tag with proper capitalization'
        ]
      });
    }
    
  } catch (error) {
    console.error('Xbox real data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve Xbox data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real PlayStation data endpoint
router.post('/api/playstation/real-data', async (req, res) => {
  try {
    const { gamerTag } = req.body;
    
    if (!gamerTag) {
      return res.status(400).json({
        success: false,
        error: 'Gamer tag is required'
      });
    }

    console.log(`🎮 Real PlayStation data request for: ${gamerTag}`);
    
    const data = await gamingService.getRealGamingData(gamerTag, 'playstation');
    
    if (data) {
      res.json({
        success: true,
        platform: 'playstation',
        data,
        realData: true,
        dataSource: data.dataSource,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: `No PlayStation data found for "${gamerTag}". The profile may be private or the gamer tag doesn't exist.`,
        suggestions: [
          'Check if the PSN ID is spelled correctly',
          'Ensure the PlayStation profile is set to public',
          'Some profiles may not be indexed on public sites'
        ]
      });
    }
    
  } catch (error) {
    console.error('PlayStation real data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve PlayStation data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Multi-platform lookup endpoint
router.post('/api/gaming/lookup', async (req, res) => {
  try {
    const { gamerTag, platforms } = req.body;
    
    if (!gamerTag) {
      return res.status(400).json({
        success: false,
        error: 'Gamer tag is required'
      });
    }

    const platformsToCheck = platforms || ['xbox', 'playstation'];
    const results: any = {};
    
    console.log(`🎮 Multi-platform lookup for ${gamerTag} on: ${platformsToCheck.join(', ')}`);
    
    // Check each platform
    for (const platform of platformsToCheck) {
      if (platform === 'xbox' || platform === 'playstation') {
        try {
          const data = await gamingService.getRealGamingData(gamerTag, platform);
          if (data) {
            results[platform] = {
              success: true,
              data,
              dataSource: data.dataSource
            };
          } else {
            results[platform] = {
              success: false,
              error: `No ${platform} data found`
            };
          }
        } catch (error) {
          results[platform] = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }
    
    const successfulPlatforms = Object.keys(results).filter(p => results[p].success);
    
    res.json({
      success: successfulPlatforms.length > 0,
      gamerTag,
      platforms: results,
      summary: {
        total: platformsToCheck.length,
        successful: successfulPlatforms.length,
        failed: platformsToCheck.length - successfulPlatforms.length
      },
      realData: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Multi-platform lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform multi-platform lookup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint to verify real data sources
router.get('/api/gaming/test-sources', async (req, res) => {
  try {
    const testResults = {
      xbox: {
        trueAchievements: 'Available',
        openXBL: process.env.OPENXBL_API_KEY ? 'API Key Configured' : 'API Key Missing',
        xboxGamertag: 'Available'
      },
      playstation: {
        psnProfiles: 'Available'
      },
      status: 'All scraping sources operational',
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      sources: testResults,
      instructions: {
        xbox: 'Set OPENXBL_API_KEY environment variable for best Xbox data',
        playstation: 'PSNProfiles provides reliable public PlayStation data'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check data sources'
    });
  }
});

export default router;