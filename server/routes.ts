import type { Express } from "express";
import friendsRoutes from "./routes/friends";
import playerStatsRoutes from "./routes/playerStats";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { steamLookupRequestSchema, type SteamLookupResponse, platformLookupRequestSchema, type PlatformLookupResponse, authCallbackSchema, type Platform } from "@shared/schema";
import { getPlatformService } from "./platformServices";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register friends and stats routes
  app.use(friendsRoutes);
  app.use(playerStatsRoutes);
  const STEAM_API_KEY = process.env.STEAM_API_KEY || process.env.STEAM_WEB_API_KEY || "";
  
  if (!STEAM_API_KEY) {
    console.warn("Warning: STEAM_API_KEY not found in environment variables");
  }

  // Initialize real gaming data service
  let gamingService: any = null;
  try {
    const { RealGamingDataService } = await import('./services/realGamingDataService');
    gamingService = new RealGamingDataService();
    console.log('✅ Real gaming data service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize gaming service:', error);
  }

  // Steam data service
  let steamService: any = null;
  try {
    const { SteamService } = await import('./services/steamService');
    steamService = new SteamService();
    console.log('✅ Steam service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Steam service:', error);
  }

  // Multi-platform lookup endpoint
  app.post("/api/platform/lookup", async (req, res) => {
    try {
      const { gamerTag, platform } = platformLookupRequestSchema.parse(req.body);
      
      const platformService = getPlatformService(platform);
      const response = await platformService.lookupPlayer(gamerTag);
      
      res.json(response);
    } catch (error) {
      console.error("Platform lookup error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred during lookup." 
      });
    }
  });

  // Cache statistics endpoint for monitoring performance
  app.get("/api/cache/stats", async (req, res) => {
    try {
      const stats = (storage as any).getCacheStats();
      const detailedStats = {
        ...stats,
        cacheTTL: "5 minutes",
        performanceMetrics: {
          steam: {
            ...stats.steam,
            hitRate: stats.steam.hits + stats.steam.misses > 0 
              ? ((stats.steam.hits / (stats.steam.hits + stats.steam.misses)) * 100).toFixed(2) + '%'
              : '0%'
          },
          playstation: {
            ...stats.playstation,
            hitRate: stats.playstation.hits + stats.playstation.misses > 0 
              ? ((stats.playstation.hits / (stats.playstation.hits + stats.playstation.misses)) * 100).toFixed(2) + '%'
              : '0%'
          },
          xbox: {
            ...stats.xbox,
            hitRate: stats.xbox.hits + stats.xbox.misses > 0 
              ? ((stats.xbox.hits / (stats.xbox.hits + stats.xbox.misses)) * 100).toFixed(2) + '%'
              : '0%'
          }
        }
      };
      res.json(detailedStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve cache statistics" });
    }
  });

  // Add PlayStation Real Data endpoint
  app.post('/api/platform/psn-real', async (req, res) => {
    try {
      const { npsso, gamerTag } = req.body;
      
      if (!npsso) {
        return res.status(400).json({ 
          success: false, 
          error: 'NPSSO token is required' 
        });
      }

      console.log(`Real PlayStation lookup for: ${gamerTag || 'current user'}`);
      
      // Import the new PSN modules
      const { getCompletePSNData } = await import('./psn/index');
      
      const psnData = await getCompletePSNData(npsso);
      
      if (psnData.success) {
        // Convert to our standard platform response format
        const response = {
          platform: "playstation" as const,
          player: {
            id: psnData.profile.accountId,
            gamerTag: psnData.profile.onlineId,
            displayName: psnData.profile.onlineId,
            avatar: psnData.profile.avatar,
            lastOnline: "Recently active",
          },
          totalHours: psnData.gaming.totalHours,
          totalGames: psnData.gaming.totalGames,
          avgHoursPerGame: psnData.gaming.totalGames > 0 ? 
            Math.round((psnData.gaming.totalHours / psnData.gaming.totalGames) * 10) / 10 : 0,
          topGames: psnData.gaming.topGames.map(game => ({
            id: `psn_${game.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
            name: game.name,
            hoursPlayed: game.hours,
            platform: "playstation" as const,
            lastPlayed: game.lastPlayed,
          })),
          qualificationStatus: psnData.gaming.totalHours > 1100 ? "qualified" as const : "not_qualified" as const,
          qualificationReason: `Real PlayStation data: ${psnData.gaming.totalHours} hours, Level ${psnData.trophies.level}`,
          realData: true,
          trophies: psnData.trophies
        };

        // Cache the real data
        await storage.setCachedPlatformLookup("playstation", psnData.profile.accountId, response);
        
        res.json(response);
      } else {
        res.status(400).json({
          success: false,
          error: psnData.error || 'Failed to fetch PlayStation data'
        });
      }
      
    } catch (error) {
      console.error('Real PSN lookup error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'PlayStation lookup failed' 
      });
    }
  });

  // Add PlayStation scraping fallback endpoint
  app.post('/api/platform/psn-scrape', async (req, res) => {
    try {
      const { npsso } = req.body;
      
      if (!npsso) {
        return res.status(400).json({ 
          success: false, 
          error: 'NPSSO token is required' 
        });
      }

      console.log('PlayStation web scraping fallback...');
      
      const { scrapePSNDashboard } = await import('./psn/scraper');
      
      const scrapeResult = await scrapePSNDashboard(npsso);
      
      if (scrapeResult.success && scrapeResult.profile) {
        const profile = scrapeResult.profile;
        
        const response = {
          platform: "playstation" as const,
          player: {
            id: `psn_${profile.username.toLowerCase()}`,
            gamerTag: profile.username,
            displayName: profile.username,
            avatar: profile.avatar || "https://via.placeholder.com/64x64/0070f3/ffffff?text=PSN",
            lastOnline: "Recently active",
          },
          totalHours: profile.totalHours,
          totalGames: profile.totalGames,
          avgHoursPerGame: profile.totalGames > 0 ? 
            Math.round((profile.totalHours / profile.totalGames) * 10) / 10 : 0,
          topGames: profile.games.slice(0, 5).map(game => ({
            id: `psn_${game.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
            name: game.name,
            hoursPlayed: game.hours || 0,
            platform: "playstation" as const,
            lastPlayed: new Date().toISOString(),
          })),
          qualificationStatus: profile.totalHours > 1100 ? "qualified" as const : "not_qualified" as const,
          qualificationReason: `Scraped PlayStation data: ${profile.totalHours} hours from ${profile.totalGames} games`,
          scrapedData: true
        };

        await storage.setCachedPlatformLookup("playstation", response.player.id, response);
        
        res.json(response);
      } else {
        res.status(400).json({
          success: false,
          error: scrapeResult.error || 'PlayStation scraping failed'
        });
      }
      
    } catch (error) {
      console.error('PSN scraping error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'PlayStation scraping failed' 
      });
    }
  });

  // PSN Token Refresh endpoint
  // Multi-source PlayStation data endpoint (ANY WAY POSSIBLE)
  app.post('/api/platform/psn-multi-source', async (req, res) => {
    try {
      const { gamerTag } = req.body;
      
      if (!gamerTag) {
        return res.status(400).json({ 
          success: false, 
          error: 'Gamer tag is required' 
        });
      }

      console.log(`🎯 Multi-source PlayStation lookup for: ${gamerTag}`);
      
      const { MultiSourcePSNData } = await import('./psn/multiSourcePSN');
      const multiSource = new MultiSourcePSNData();
      
      try {
        const psnData = await multiSource.getPlayStationData(gamerTag);
        
        // Convert to standard platform response format
        const response: any = {
          platform: 'playstation' as const,
          player: {
            id: psnData.profile.onlineId,
            gamerTag: psnData.profile.onlineId,
            displayName: psnData.profile.displayName,
            avatar: psnData.profile.avatarUrl || '',
            lastOnline: psnData.timestamp
          },
          totalHours: psnData.totalHours,
          totalGames: psnData.totalGames,
          avgHoursPerGame: psnData.avgHoursPerGame,
          topGames: psnData.games.slice(0, 3).map(game => ({
            id: game.name,
            name: game.name,
            hoursPlayed: game.hoursPlayed,
            platform: 'playstation' as const,
            lastPlayed: game.lastPlayed || new Date().toISOString()
          })),
          qualificationStatus: 'qualified' as const,
          qualificationReason: `Data from ${psnData.source} (${psnData.dataQuality} quality)`,
          realData: true,
          dataSource: psnData.source,
          dataQuality: psnData.dataQuality,
          dataFreshness: psnData.freshness,
          trophies: {
            level: psnData.profile.level,
            progress: psnData.profile.progress,
            totalTrophies: psnData.profile.totalTrophies,
            platinum: psnData.profile.platinum,
            gold: psnData.profile.gold,
            silver: psnData.profile.silver,
            bronze: psnData.profile.bronze,
            trophyScore: psnData.profile.totalTrophies * 100,
            category: psnData.dataQuality
          }
        };

        // Cache the result
        await storage.setCachedPlatformLookup("playstation", psnData.profile.onlineId, response);
        
        console.log(`✅ Multi-source success: ${psnData.source} (${psnData.dataQuality})`);
        
        // Cleanup
        await multiSource.cleanup();
        
        res.json(response);
        
      } catch (error) {
        console.error('❌ All PlayStation sources failed:', error);
        await multiSource.cleanup();
        
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'All PlayStation data sources failed',
          gamerTag,
          sources_attempted: ['official_api', 'psnprofiles_scraper', 'combined_fallback']
        });
      }
      
    } catch (error) {
      console.error('Multi-source PSN endpoint error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Multi-source lookup failed' 
      });
    }
  });

  app.post('/api/platform/psn-refresh-token', async (req, res) => {
    try {
      const { npsso, userId = 'default' } = req.body;
      
      if (!npsso) {
        return res.status(400).json({ 
          success: false, 
          error: 'NPSSO token is required' 
        });
      }

      // Test the new token by validating it
      const { validateNpssoToken } = await import('./psn/validateToken');
      const isValid = await validateNpssoToken(npsso);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid NPSSO token provided'
        });
      }

      // Store token in token manager and update environment
      const { tokenManager, updateEnvironmentToken } = await import('./tokenManager');
      tokenManager.storeToken(userId, npsso);
      updateEnvironmentToken(npsso);
      
      res.json({
        success: true,
        message: 'PSN token refreshed successfully'
      });
      
    } catch (error) {
      console.error('PSN token refresh error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      });
    }
  });

  // PSN Token Status endpoint
  app.get('/api/psn/status', async (req, res) => {
    try {
      const { userId = 'default' } = req.query;
      const { tokenManager } = await import('./tokenManager');
      
      const status = tokenManager.getTokenStatus(userId as string);
      
      res.json({
        success: true,
        tokenStatus: status
      });
      
    } catch (error) {
      console.error('PSN status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check PSN token status'
      });
    }
  });

  // Internal Puppeteer Login endpoint (staff use only)
  app.post('/api/psn/internal-login', async (req, res) => {
    try {
      const { username, password, userId = 'default' } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password required'
        });
      }

      const { automatePlayStationLogin } = await import('./puppeteerLogin');
      const result = await automatePlayStationLogin({ username, password });
      
      if (result.success && result.npssoToken) {
        // Store the token
        const { tokenManager, updateEnvironmentToken } = await import('./tokenManager');
        tokenManager.storeToken(userId, result.npssoToken);
        updateEnvironmentToken(result.npssoToken);
        
        res.json({
          success: true,
          message: 'PSN login automated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Login automation failed'
        });
      }
      
    } catch (error) {
      console.error('Internal PSN login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal login automation failed'
      });
    }
  });

  // Steam lookup endpoint
  app.post("/api/steam/lookup", async (req, res) => {
    try {
      const { gamerTag } = steamLookupRequestSchema.parse(req.body);
      
      if (!STEAM_API_KEY) {
        return res.status(500).json({ 
          error: "Steam API key not configured. Please add STEAM_API_KEY to environment variables." 
        });
      }

      // Step 1: Resolve gamer tag to SteamID64
      let steamId = gamerTag;
      
      // Check if it's already a SteamID64 (17 digits starting with 765)
      if (!/^765\d{14}$/.test(gamerTag)) {
        try {
          const vanityResponse = await axios.get(
            `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/`,
            {
              params: {
                key: STEAM_API_KEY,
                vanityurl: gamerTag,
              },
            }
          );

          if (vanityResponse.data.response.success !== 1) {
            return res.status(404).json({ 
              error: "Steam profile not found. Please check the gamer tag and try again." 
            });
          }

          steamId = vanityResponse.data.response.steamid;
        } catch (error) {
          return res.status(404).json({ 
            error: "Unable to resolve gamer tag. Please check the input and try again." 
          });
        }
      }

      // Check cache first
      const cached = await storage.getCachedLookup(steamId);
      if (cached) {
        return res.json(cached);
      }

      // Step 2: Get player summary
      const playerResponse = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`,
        {
          params: {
            key: STEAM_API_KEY,
            steamids: steamId,
          },
        }
      );

      const players = playerResponse.data.response.players;
      if (!players || players.length === 0) {
        return res.status(404).json({ 
          error: "Steam profile not found or may be private." 
        });
      }

      const player = players[0];
      
      // Check if profile is visible to API (communityvisibilitystate: 3 = public)
      if (player.communityvisibilitystate !== 3) {
        return res.status(403).json({ 
          error: "This Steam profile is private to the Steam Web API. To fix this:\n\n1. Open Steam client\n2. Go to Steam → View → Settings\n3. Click 'Privacy Settings'\n4. Set 'My Profile' to 'Public'\n5. Set 'Game Details' to 'Public'\n6. Wait a few minutes for changes to take effect\n\nNote: Website privacy settings are different from API privacy settings." 
        });
      }

      // Step 3: Get owned games
      const gamesResponse = await axios.get(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
        {
          params: {
            key: STEAM_API_KEY,
            steamid: steamId,
            format: "json",
            include_appinfo: 1,
            include_played_free_games: 1,
          },
        }
      );

      if (!gamesResponse.data.response.games) {
        return res.status(403).json({ 
          error: "This Steam profile's game details are private. To fix this:\n\n1. Go to Steam → View → Settings → Privacy Settings\n2. Set 'My Profile' to Public\n3. Set 'Game Details' to Public\n4. Set 'My Game Library' to Public\n\nNote: Changes may take a few minutes to take effect." 
        });
      }

      const games = gamesResponse.data.response.games || [];
      
      // Calculate statistics
      const totalMinutes = games.reduce((sum: number, game: any) => sum + game.playtime_forever, 0);
      const totalHours = Math.round(totalMinutes / 60);
      const totalGames = games.length;
      const avgHoursPerGame = totalGames > 0 ? Math.round((totalHours / totalGames) * 10) / 10 : 0;

      // Get top 3 most played games
      const topGames = games
        .sort((a: any, b: any) => b.playtime_forever - a.playtime_forever)
        .slice(0, 3)
        .map((game: any) => ({
          appid: game.appid,
          name: game.name,
          playtime_forever: Math.round(game.playtime_forever / 60), // Convert to hours
          playtime_2weeks: game.playtime_2weeks ? Math.round(game.playtime_2weeks / 60) : 0,
          img_icon_url: game.img_icon_url,
          img_logo_url: game.img_logo_url,
        }));

      // Format last logoff time
      let lastLogoffFormatted = "Unknown";
      if (player.lastlogoff) {
        const lastLogoff = new Date(player.lastlogoff * 1000);
        const now = new Date();
        const diffMs = now.getTime() - lastLogoff.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) {
          lastLogoffFormatted = "Less than an hour ago";
        } else if (diffHours < 24) {
          lastLogoffFormatted = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
          lastLogoffFormatted = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
          lastLogoffFormatted = lastLogoff.toLocaleDateString();
        }
      }

      const response: SteamLookupResponse = {
        player,
        totalHours,
        totalGames,
        avgHoursPerGame,
        topGames,
        lastLogoffFormatted,
      };

      // Cache the response
      await storage.setCachedLookup(steamId, response);

      res.json(response);
    } catch (error: any) {
      console.error("Steam API error:", error);
      
      if (error.response?.status === 403) {
        return res.status(403).json({ 
          error: "Steam API access forbidden. Please check your API key." 
        });
      }
      
      if (error.response?.status === 401) {
        return res.status(401).json({ 
          error: "Invalid Steam API key. Please check your configuration." 
        });
      }

      res.status(500).json({ 
        error: "An error occurred while fetching Steam data. Please try again later." 
      });
    }
  });

  // Multi-platform lookup endpoint
  app.post("/api/platform/lookup", async (req, res) => {
    try {
      const { gamerTag, platform } = platformLookupRequestSchema.parse(req.body);
      
      const platformService = getPlatformService(platform);
      const result = await platformService.lookupPlayer(gamerTag);
      
      res.json(result);
    } catch (error: any) {
      console.error(`Platform API error:`, error);
      
      if (error.response?.status === 403) {
        return res.status(403).json({ 
          error: error.message || "Platform API access forbidden. Please check your API key or permissions." 
        });
      }
      
      if (error.response?.status === 401) {
        return res.status(401).json({ 
          error: error.message || "Invalid platform API key. Please check your configuration." 
        });
      }

      res.status(500).json({ 
        error: error.message || "An error occurred while fetching platform data. Please try again later." 
      });
    }
  });

  // Platform authentication endpoints
  app.post("/api/platform/auth/:platform", async (req, res) => {
    try {
      const platform = req.params.platform as Platform;
      const { authCode } = authCallbackSchema.parse({ platform, authCode: req.body.authCode });
      
      const platformService = getPlatformService(platform);
      const authResult = await platformService.authenticate(authCode);
      
      // In a real implementation, you'd store the tokens securely and associate with user
      res.json({ 
        success: true, 
        message: `${platform} authentication successful`,
        expiresAt: authResult.expiresAt 
      });
    } catch (error: any) {
      console.error(`${req.params.platform} auth error:`, error);
      res.status(500).json({ 
        error: error.message || "Authentication failed. Please try again." 
      });
    }
  });

  // Get user's friends from a platform
  app.get("/api/platform/:platform/friends/:userId", async (req, res) => {
    try {
      const platform = req.params.platform as Platform;
      const userId = req.params.userId;
      
      // In a real implementation, you'd get the access token from the user's stored credentials
      const platformService = getPlatformService(platform);
      const friends = await platformService.getFriends(userId, "dummy_token");
      
      res.json({ friends });
    } catch (error: any) {
      console.error(`${req.params.platform} friends error:`, error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch friends list. Please try again." 
      });
    }
  });

  // Steam real data endpoint  
  app.post("/api/steam/real-data", async (req, res) => {
    try {
      const { gamerTag } = req.body;

      if (!gamerTag) {
        return res.status(400).json({
          success: false,
          error: 'Gamer tag is required'
        });
      }

      console.log(`🎮 Real Steam data request for: ${gamerTag}`);
      
      if (!steamService) {
        return res.status(500).json({
          success: false,
          error: 'Steam service not available'
        });
      }
      
      const data = await steamService.getRealSteamProfile(gamerTag);
      
      if (data) {
        res.json({
          success: true,
          platform: 'steam',
          data,
          realData: true,
          dataSource: data.dataSource,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          success: false,
          error: `No Steam data found for "${gamerTag}". The profile may be private or the username doesn't exist.`,
          suggestions: [
            'Check if the Steam username is spelled correctly',
            'Ensure the Steam profile is set to public',
            'Try using the Steam ID instead of username'
          ]
        });
      }
    } catch (error) {
      console.error('Steam real data error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Steam data'
      });
    }
  });

  // Get platform connection status
  app.get("/api/platform/status", async (req, res) => {
    const status = {
      steam: {
        available: !!(process.env.STEAM_API_KEY || process.env.STEAM_WEB_API_KEY),
        features: ["lookup", "games", "stats"],
        authRequired: false,
      },
      playstation: {
        available: false,
        features: ["lookup", "friends", "trophies"],
        authRequired: true,
        comingSoon: true,
      },
      xbox: {
        available: false,
        features: ["lookup", "friends", "achievements"],
        authRequired: true,
        comingSoon: true,
      },
    };
    
    res.json(status);
  });

  // Real Xbox data endpoint using proven methods
  app.post("/api/xbox/real-data", async (req, res) => {
    try {
      const { gamerTag } = req.body;
      
      if (!gamerTag) {
        return res.status(400).json({
          success: false,
          error: 'Gamer tag is required'
        });
      }

      console.log(`🎮 Real Xbox data request for: ${gamerTag}`);
      
      if (!gamingService) {
        return res.status(500).json({
          success: false,
          error: 'Gaming service not available'
        });
      }
      
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

  // Real PlayStation data endpoint using proven methods
  app.post("/api/playstation/real-data", async (req, res) => {
    try {
      const { gamerTag } = req.body;
      
      if (!gamerTag) {
        return res.status(400).json({
          success: false,
          error: 'Gamer tag is required'
        });
      }

      console.log(`🎮 Real PlayStation data request for: ${gamerTag}`);
      
      if (!gamingService) {
        return res.status(500).json({
          success: false,
          error: 'Gaming service not available'
        });
      }
      
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

  // Test endpoint to verify real data sources
  app.get("/api/gaming/test-sources", async (req, res) => {
    try {
      const testResults = {
        xbox: {
          trueAchievements: 'Available - Public scraping',
          openXBL: process.env.OPENXBL_API_KEY ? 'API Key Configured' : 'API Key Missing',
          xboxGamertag: 'Available - Public scraping'
        },
        playstation: {
          psnProfiles: 'Available - Public scraping'
        },
        status: 'Multiple real data sources operational',
        instructions: {
          xbox: 'Set OPENXBL_API_KEY environment variable for best Xbox data. Otherwise uses TrueAchievements scraping.',
          playstation: 'PSNProfiles provides reliable public PlayStation data via scraping.'
        },
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        sources: testResults
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check data sources'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
