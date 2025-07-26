import puppeteer from 'puppeteer';
import { Platform, PlatformLookupResponse } from '../../shared/schema';

export class PlayStationScraperService {
  private npssoToken: string;

  constructor() {
    this.npssoToken = process.env.PSN_NPSSO_TOKEN || "";
    if (!this.npssoToken) {
      console.warn('⚠️ PSN_NPSSO_TOKEN not found - PlayStation scraping unavailable');
    }
  }

  async scrapePlayerProfile(gamerTag: string): Promise<PlatformLookupResponse> {
    if (!this.npssoToken) {
      throw new Error("PlayStation NPSSO token not configured");
    }

    console.log(`🎮 Starting PlayStation scrape for: ${gamerTag}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Set mobile viewport for better hours display
      await page.setViewport({ width: 375, height: 667 });
      
      // Set NPSSO cookie for authentication
      await page.setCookie({
        name: 'npsso',
        value: this.npssoToken,
        domain: '.playstation.com',
        path: '/',
        httpOnly: true,
        secure: true
      });

      console.log(`🔍 Navigating to PlayStation profile: ${gamerTag}`);
      
      // Navigate to the user's profile
      const profileUrl = `https://my.playstation.com/profile/${gamerTag}`;
      await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for profile content to load
      await page.waitForSelector('[data-qa="profile-games-section"], .profile-games, .recently-played', { timeout: 15000 });

      console.log(`📊 Extracting game data from profile...`);

      // Extract game data from the profile
      const gameData = await page.evaluate(() => {
        const games: any[] = [];
        
        // Try multiple selectors for game elements
        const gameSelectors = [
          '[data-qa="game-item"]',
          '.game-item',
          '.recently-played-game',
          '.profile-game'
        ];
        
        let gameElements: NodeListOf<Element> | null = null;
        
        for (const selector of gameSelectors) {
          gameElements = document.querySelectorAll(selector);
          if (gameElements.length > 0) {
            console.log(`Found ${gameElements.length} games using selector: ${selector}`);
            break;
          }
        }

        if (!gameElements || gameElements.length === 0) {
          // Fallback: look for any elements containing game titles and hours
          gameElements = document.querySelectorAll('[data-qa*="game"], [class*="game"]');
        }

        gameElements.forEach((element, index) => {
          try {
            // Extract game title
            const titleSelectors = [
              '[data-qa="game-title"]',
              '.game-title',
              '.game-name',
              'h3',
              'h4',
              '[title]'
            ];
            
            let title = '';
            for (const selector of titleSelectors) {
              const titleEl = element.querySelector(selector);
              if (titleEl) {
                title = titleEl.textContent?.trim() || titleEl.getAttribute('title') || '';
                if (title) break;
              }
            }

            // Extract playtime hours
            const timeSelectors = [
              '[data-qa*="time"]',
              '[data-qa*="hours"]',
              '.playtime',
              '.hours-played',
              '[class*="time"]',
              '[class*="hours"]'
            ];
            
            let hoursText = '';
            for (const selector of timeSelectors) {
              const timeEl = element.querySelector(selector);
              if (timeEl) {
                hoursText = timeEl.textContent?.trim() || '';
                if (hoursText.includes('h') || hoursText.includes('hour')) break;
              }
            }

            // Parse hours from text like "786h" or "142 hours"
            const hoursMatch = hoursText.match(/(\d+)\s*h/i);
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;

            // Extract trophy data
            const trophyData = {
              platinum: 0,
              gold: 0,
              silver: 0,
              bronze: 0
            };

            // Look for trophy elements
            const trophySelectors = [
              '.trophy-platinum',
              '.trophy-gold', 
              '.trophy-silver',
              '.trophy-bronze',
              '[data-qa*="trophy"]'
            ];

            trophySelectors.forEach(selector => {
              const trophyEl = element.querySelector(selector);
              if (trophyEl) {
                const count = parseInt(trophyEl.textContent?.trim() || '0');
                if (selector.includes('platinum')) trophyData.platinum = count;
                else if (selector.includes('gold')) trophyData.gold = count;
                else if (selector.includes('silver')) trophyData.silver = count;
                else if (selector.includes('bronze')) trophyData.bronze = count;
              }
            });

            if (title && (hours > 0 || hoursText)) {
              games.push({
                id: `psn_${index}`,
                name: title,
                hoursPlayed: hours,
                platform: 'playstation' as Platform,
                lastPlayed: 'Recently',
                trophies: trophyData,
                rawTimeText: hoursText // Keep original text for debugging
              });
            }
          } catch (error) {
            console.log(`Error parsing game ${index}:`, error);
          }
        });

        return games;
      });

      console.log(`✅ Extracted ${gameData.length} games with playtime data`);

      // Log sample data for debugging
      if (gameData.length > 0) {
        console.log('Sample games found:');
        gameData.slice(0, 3).forEach(game => {
          console.log(`  • ${game.name}: ${game.hoursPlayed}h (${game.rawTimeText})`);
        });
      }

      // Extract profile information
      const profileData = await page.evaluate(() => {
        const profileName = document.querySelector('[data-qa="profile-name"], .profile-name, h1')?.textContent?.trim() || '';
        const avatarUrl = document.querySelector('[data-qa="profile-avatar"] img, .profile-avatar img, .avatar img')?.getAttribute('src') || '';
        
        return {
          profileName,
          avatarUrl
        };
      });

      const totalHours = gameData.reduce((sum: number, game: any) => sum + game.hoursPlayed, 0);

      const response: PlatformLookupResponse = {
        platform: 'playstation',
        player: {
          id: gamerTag,
          gamerTag: gamerTag,
          displayName: profileData.profileName || gamerTag,
          avatar: profileData.avatarUrl || '',
          lastOnline: 'Recently',
          gamerscore: 0 // PlayStation uses trophies instead
        },
        totalGames: gameData.length,
        totalHours, // Real hours from PlayStation profile
        avgHoursPerGame: gameData.length > 0 ? Math.round(totalHours / gameData.length) : 0,
        qualificationStatus: 'qualified' as const,
        qualificationReason: `Real playtime data scraped from PlayStation profile (${totalHours}h across ${gameData.length} games)`,
        topGames: gameData.slice(0, 10),
        trophies: {
          level: 1,
          progress: 0,
          totalTrophies: gameData.reduce((sum, game) => sum + (game.trophies?.platinum || 0) + (game.trophies?.gold || 0) + (game.trophies?.silver || 0) + (game.trophies?.bronze || 0), 0),
          platinum: gameData.reduce((sum: number, game: any) => sum + (game.trophies?.platinum || 0), 0),
          gold: gameData.reduce((sum: number, game: any) => sum + (game.trophies?.gold || 0), 0),
          silver: gameData.reduce((sum: number, game: any) => sum + (game.trophies?.silver || 0), 0),
          bronze: gameData.reduce((sum: number, game: any) => sum + (game.trophies?.bronze || 0), 0),
          trophyScore: 0,
          category: 'Gaming'
        }
      };

      console.log(`📊 PlayStation scrape complete: ${response.totalGames} games, ${response.totalHours} authentic hours`);
      return response;

    } catch (error: any) {
      console.error('❌ PlayStation scraping failed:', error.message);
      throw new Error(`PlayStation profile scraping failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
}