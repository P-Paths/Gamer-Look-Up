/**
 * PSNProfiles.com Scraper for Public PlayStation Data
 * Scrapes publicly available trophy and gaming data from PSNProfiles
 */

import puppeteer from 'puppeteer';

interface PSNProfilesData {
  profile: {
    onlineId: string;
    displayName: string;
    level: number;
    progress: number;
    totalTrophies: number;
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
    completionPercentage: number;
    worldRank?: number;
    countryRank?: number;
  };
  games: Array<{
    name: string;
    platform: string;
    hoursPlayed: number;
    completionPercentage: number;
    trophiesEarned: number;
    totalTrophies: number;
    rarity?: number;
    imageUrl?: string;
    lastPlayed?: string;
  }>;
  recentTrophies: Array<{
    name: string;
    description: string;
    game: string;
    type: 'bronze' | 'silver' | 'gold' | 'platinum';
    earnedAt: string;
    rarity: number;
  }>;
}

class PSNProfilesScraper {
  private browser: any = null;

  async launchBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeUserProfile(gamerTag: string): Promise<PSNProfilesData> {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();

    try {
      console.log(`🕷️ Scraping PSNProfiles for: ${gamerTag}`);

      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      const profileUrl = `https://psnprofiles.com/${encodeURIComponent(gamerTag)}`;
      console.log(`📍 Navigating to: ${profileUrl}`);

      await page.goto(profileUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Check if profile exists
      const profileNotFound = await page.$('.error-404');
      if (profileNotFound) {
        throw new Error(`PSNProfiles user "${gamerTag}" not found`);
      }

      // Wait for profile data to load
      await page.waitForSelector('.trophy-count', { timeout: 10000 });

      // Extract profile information
      const profileData = await page.evaluate(() => {
        const extractText = (selector: string): string => {
          const element = document.querySelector(selector);
          return element ? element.textContent?.trim() || '' : '';
        };

        const extractNumber = (selector: string): number => {
          const text = extractText(selector);
          return parseInt(text.replace(/[^\d]/g, '')) || 0;
        };

        // Profile stats
        const level = extractNumber('.trophy-count .stat .typo-top');
        const progress = extractNumber('.trophy-count .stat .typo-bottom');
        
        // Trophy counts
        const platinum = extractNumber('.trophy .platinum span:last-child');
        const gold = extractNumber('.trophy .gold span:last-child');
        const silver = extractNumber('.trophy .silver span:last-child');
        const bronze = extractNumber('.trophy .bronze span:last-child');
        
        const totalTrophies = platinum + gold + silver + bronze;

        // Completion percentage
        const completionText = extractText('.completion-percentage');
        const completionPercentage = parseFloat(completionText.replace('%', '')) || 0;

        // Rankings (if available)
        const worldRankText = extractText('.rank .world');
        const worldRank = worldRankText ? parseInt(worldRankText.replace(/[^\d]/g, '')) : undefined;

        return {
          level,
          progress,
          totalTrophies,
          platinum,
          gold,
          silver,
          bronze,
          completionPercentage,
          worldRank
        };
      });

      // Extract games data
      console.log('🎮 Extracting games data...');
      const gamesData = await page.evaluate(() => {
        const gameElements = document.querySelectorAll('.zebra tr');
        const games: any[] = [];

        gameElements.forEach((row: any) => {
          const nameEl = row.querySelector('.title a');
          const platformEl = row.querySelector('.platforms img');
          const progressEl = row.querySelector('.progress-percentage');
          const trophyEls = row.querySelectorAll('.trophy span');

          if (nameEl) {
            const name = nameEl.textContent?.trim() || '';
            const platform = platformEl?.getAttribute('title') || 'Unknown';
            const completionText = progressEl?.textContent?.trim() || '0%';
            const completionPercentage = parseFloat(completionText.replace('%', '')) || 0;

            // Extract trophy counts
            let trophiesEarned = 0;
            let totalTrophies = 0;
            
            if (trophyEls.length >= 2) {
              const earnedText = trophyEls[0]?.textContent?.trim() || '0';
              const totalText = trophyEls[1]?.textContent?.trim() || '0';
              trophiesEarned = parseInt(earnedText) || 0;
              totalTrophies = parseInt(totalText) || 0;
            }

            // Estimate hours based on completion and platform
            const estimateHours = (completion: number, trophies: number, platform: string): number => {
              let baseHours = 10;
              const platformMultiplier: any = {
                'PlayStation 5': 1.2,
                'PlayStation 4': 1.0,
                'PlayStation 3': 0.8,
                'PS Vita': 0.6
              };
              
              const multiplier = platformMultiplier[platform] || 1.0;
              const trophyFactor = Math.min(trophies / 20, 3);
              const completionFactor = Math.pow(completion / 100, 0.7);
              
              return Math.round(baseHours * multiplier * trophyFactor * completionFactor);
            };

            const hoursPlayed = estimateHours(completionPercentage, totalTrophies, platform);

            games.push({
              name,
              platform,
              hoursPlayed,
              completionPercentage,
              trophiesEarned,
              totalTrophies
            });
          }
        });

        return games.slice(0, 20); // Limit to top 20 games
      });

      // Extract recent trophies
      console.log('🏆 Extracting recent trophies...');
      try {
        await page.goto(`${profileUrl}?order=date&type=trophies`, { 
          waitUntil: 'networkidle0',
          timeout: 15000 
        });

        const recentTrophies = await page.evaluate(() => {
          const trophyElements = document.querySelectorAll('.trophy-row');
          const trophies: any[] = [];

          trophyElements.forEach((row: any, index: number) => {
            if (index >= 10) return; // Limit to 10 recent trophies

            const nameEl = row.querySelector('.trophy-title');
            const descEl = row.querySelector('.trophy-description');
            const gameEl = row.querySelector('.game-title a');
            const typeEl = row.querySelector('.trophy img');
            const dateEl = row.querySelector('.earned-date');
            const rarityEl = row.querySelector('.rarity');

            if (nameEl && gameEl) {
              const name = nameEl.textContent?.trim() || '';
              const description = descEl?.textContent?.trim() || '';
              const game = gameEl.textContent?.trim() || '';
              const typeImg = typeEl?.getAttribute('src') || '';
              
              let type: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
              if (typeImg.includes('platinum')) type = 'platinum';
              else if (typeImg.includes('gold')) type = 'gold';
              else if (typeImg.includes('silver')) type = 'silver';

              const earnedAt = dateEl?.textContent?.trim() || '';
              const rarityText = rarityEl?.textContent?.trim() || '0%';
              const rarity = parseFloat(rarityText.replace('%', '')) || 0;

              trophies.push({
                name,
                description,
                game,
                type,
                earnedAt,
                rarity
              });
            }
          });

          return trophies;
        });

        const result: PSNProfilesData = {
          profile: {
            onlineId: gamerTag,
            displayName: gamerTag,
            ...profileData
          },
          games: gamesData,
          recentTrophies
        };

        console.log(`✅ Successfully scraped data for ${gamerTag}`);
        console.log(`📊 Profile: Level ${result.profile.level}, ${result.profile.totalTrophies} trophies`);
        console.log(`🎮 Games: ${result.games.length} games found`);
        console.log(`🏆 Recent: ${result.recentTrophies.length} recent trophies`);

        return result;

      } catch (error) {
        console.warn('⚠️ Could not fetch recent trophies, continuing with profile and games data');
        
        return {
          profile: {
            onlineId: gamerTag,
            displayName: gamerTag,
            ...profileData
          },
          games: gamesData,
          recentTrophies: []
        };
      }

    } catch (error) {
      console.error('❌ PSNProfiles scraping failed:', error);
      throw new Error(`PSNProfiles scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await page.close();
    }
  }

  async isUserProfilePublic(gamerTag: string): Promise<boolean> {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      const profileUrl = `https://psnprofiles.com/${encodeURIComponent(gamerTag)}`;
      
      const response = await page.goto(profileUrl, { 
        waitUntil: 'networkidle0',
        timeout: 15000 
      });

      if (!response) return false;

      // Check for various indicators that profile is not accessible
      const isPrivate = await page.evaluate(() => {
        return document.querySelector('.error-404') !== null ||
               document.querySelector('.private-profile') !== null ||
               document.body.textContent?.includes('private') === true;
      });

      return !isPrivate;
    } catch (error) {
      console.error('❌ Error checking profile accessibility:', error);
      return false;
    } finally {
      await page.close();
    }
  }
}

export { PSNProfilesScraper, type PSNProfilesData };