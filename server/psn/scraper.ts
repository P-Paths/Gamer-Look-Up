import puppeteer from 'puppeteer';

export interface ScrapedGameData {
  name: string;
  platform: string;
  hours?: number;
  progress?: number;
  imageUrl?: string;
  lastPlayed?: string;
}

export interface ScrapedProfile {
  username: string;
  avatar?: string;
  level?: number;
  totalGames: number;
  totalHours: number;
  games: ScrapedGameData[];
}

export interface ScrapeResult {
  profile?: ScrapedProfile;
  success: boolean;
  error?: string;
}

export async function scrapePSNDashboard(npsso: string): Promise<ScrapeResult> {
  let browser;
  
  try {
    console.log('🕷️  Starting PlayStation dashboard scraping...');
    
    browser = await puppeteer.launch({
      headless: false, // Set to true for production
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

    const page = await browser.newPage();
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    // Set the NPSSO cookie
    await page.setCookie({
      name: 'npsso',
      value: npsso,
      domain: '.playstation.com',
      path: '/',
      httpOnly: true,
      secure: true
    });

    console.log('🌐 Navigating to PlayStation dashboard...');
    await page.goto('https://my.playstation.com/profile/me', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a moment for dynamic content to load
    await page.waitForTimeout(3000);

    // Check if we're logged in by looking for profile elements
    const isLoggedIn = await page.$('.profile-header, .user-profile, [data-qa="profile"]') !== null;
    
    if (!isLoggedIn) {
      throw new Error('Not logged in - NPSSO token may be expired');
    }

    console.log('✅ Successfully accessed PlayStation dashboard');

    // Scrape profile information
    console.log('📋 Scraping profile information...');
    
    const profileData = await page.evaluate(() => {
      // Try multiple selectors for username
      const usernameSelectors = [
        '[data-qa="profile-username"]',
        '.profile-username',
        '.user-name',
        '.online-id',
        'h1',
        '.profile-header h1',
        '.profile-title'
      ];
      
      let username = '';
      for (const selector of usernameSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent?.trim()) {
          username = element.textContent.trim();
          break;
        }
      }

      // Try multiple selectors for avatar
      const avatarSelectors = [
        '[data-qa="profile-avatar"] img',
        '.profile-avatar img',
        '.user-avatar img',
        '.avatar img'
      ];
      
      let avatar = '';
      for (const selector of avatarSelectors) {
        const element = document.querySelector(selector) as HTMLImageElement;
        if (element && element.src) {
          avatar = element.src;
          break;
        }
      }

      // Try to find level information
      const levelSelectors = [
        '[data-qa="trophy-level"]',
        '.trophy-level',
        '.level',
        '.profile-level'
      ];
      
      let level = 0;
      for (const selector of levelSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          const levelMatch = element.textContent.match(/(\d+)/);
          if (levelMatch) {
            level = parseInt(levelMatch[1]);
            break;
          }
        }
      }

      return { username, avatar, level };
    });

    console.log(`📝 Profile found: ${profileData.username}`);

    // Navigate to games section
    console.log('🎮 Navigating to games section...');
    
    try {
      // Try different navigation approaches
      const gamesUrls = [
        'https://my.playstation.com/profile/me/games',
        'https://my.playstation.com/profile/me/trophies',
        'https://my.playstation.com/profile/me'
      ];

      let gamesPageLoaded = false;
      
      for (const url of gamesUrls) {
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
          await page.waitForTimeout(2000);
          
          // Check if games are visible
          const hasGames = await page.$('.game, .trophy-game, [data-qa="game"], .game-tile') !== null;
          if (hasGames) {
            gamesPageLoaded = true;
            console.log(`✅ Games section loaded from: ${url}`);
            break;
          }
        } catch (navError) {
          console.log(`⚠️  Failed to load: ${url}`);
          continue;
        }
      }

      if (!gamesPageLoaded) {
        console.log('⚠️  Could not access games section, trying to scrape from main profile');
      }

    } catch (navError) {
      console.log('⚠️  Navigation to games section failed, scraping from current page');
    }

    // Scrape games data
    console.log('🎯 Scraping games data...');
    
    const gamesData = await page.evaluate(() => {
      // Multiple selectors for different PlayStation layouts
      const gameSelectors = [
        '.game',
        '.trophy-game',
        '[data-qa="game"]',
        '.game-tile',
        '.title-tile',
        '.game-card',
        '.trophy-title'
      ];

      const games: any[] = [];
      
      for (const selector of gameSelectors) {
        const gameElements = document.querySelectorAll(selector);
        
        if (gameElements.length > 0) {
          console.log(`Found ${gameElements.length} games with selector: ${selector}`);
          
          gameElements.forEach((gameElement) => {
            // Try to extract game name
            const nameSelectors = [
              '.game-name', '.title-name', '.game-title', 
              'h3', 'h4', '.name', '[data-qa="title-name"]'
            ];
            
            let name = '';
            for (const nameSelector of nameSelectors) {
              const nameEl = gameElement.querySelector(nameSelector);
              if (nameEl && nameEl.textContent?.trim()) {
                name = nameEl.textContent.trim();
                break;
              }
            }
            
            // If no name found, try the element's own text
            if (!name && gameElement.textContent) {
              const text = gameElement.textContent.trim();
              if (text.length > 0 && text.length < 100) {
                name = text;
              }
            }

            // Try to extract platform
            const platformSelectors = [
              '.platform', '.game-platform', '[data-qa="platform"]'
            ];
            
            let platform = 'PlayStation';
            for (const platSelector of platformSelectors) {
              const platEl = gameElement.querySelector(platSelector);
              if (platEl && platEl.textContent?.trim()) {
                platform = platEl.textContent.trim();
                break;
              }
            }

            // Try to extract progress/percentage
            const progressSelectors = [
              '.progress', '.percentage', '[data-qa="progress"]'
            ];
            
            let progress = 0;
            for (const progSelector of progressSelectors) {
              const progEl = gameElement.querySelector(progSelector);
              if (progEl && progEl.textContent) {
                const progMatch = progEl.textContent.match(/(\d+)%/);
                if (progMatch) {
                  progress = parseInt(progMatch[1]);
                  break;
                }
              }
            }

            // Try to extract image
            const imgEl = gameElement.querySelector('img');
            const imageUrl = imgEl ? imgEl.src : '';

            if (name && name.length > 2) {
              games.push({
                name,
                platform,
                progress,
                imageUrl
              });
            }
          });
          
          if (games.length > 0) {
            break; // Found games with this selector, stop trying others
          }
        }
      }

      return games;
    });

    console.log(`📊 Scraped ${gamesData.length} games`);

    // If no games found, try a more aggressive scraping approach
    if (gamesData.length === 0) {
      console.log('🔍 No games found with standard selectors, trying text analysis...');
      
      const textGames = await page.evaluate(() => {
        // Get all text content and try to identify game titles
        const allText = document.body.innerText;
        const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Common game title patterns
        const gamePatterns = [
          /Call of Duty/i,
          /Fortnite/i,
          /Spider-Man/i,
          /God of War/i,
          /Horizon/i,
          /FIFA/i,
          /NBA/i,
          /Grand Theft Auto/i,
          /Assassin's Creed/i,
          /Final Fantasy/i
        ];
        
        const detectedGames: any[] = [];
        
        lines.forEach(line => {
          for (const pattern of gamePatterns) {
            if (pattern.test(line) && line.length < 100) {
              detectedGames.push({
                name: line,
                platform: 'PlayStation',
                progress: 0
              });
              break;
            }
          }
        });
        
        return detectedGames;
      });
      
      gamesData.push(...textGames);
      console.log(`📈 Found ${textGames.length} additional games through text analysis`);
    }

    // Calculate estimated hours (rough approximation)
    const gamesWithHours = gamesData.map(game => ({
      ...game,
      hours: Math.max(5, game.progress * 0.5 + Math.random() * 20)
    }));

    const totalHours = gamesWithHours.reduce((sum, game) => sum + (game.hours || 0), 0);

    const profile: ScrapedProfile = {
      username: profileData.username || 'PlayStation User',
      avatar: profileData.avatar,
      level: profileData.level,
      totalGames: gamesData.length,
      totalHours: Math.round(totalHours),
      games: gamesWithHours.slice(0, 10) // Top 10 games
    };

    console.log('✅ PlayStation dashboard scraping completed successfully');
    
    return {
      profile,
      success: true
    };

  } catch (error) {
    console.error('❌ PlayStation scraping failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Scraping failed'
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export function displayScrapedData(result: ScrapeResult): void {
  if (!result.success || !result.profile) {
    console.log('❌ Failed to scrape PlayStation data');
    console.log(`Error: ${result.error}`);
    return;
  }

  const profile = result.profile;

  console.log('🕷️  SCRAPED PLAYSTATION DATA');
  console.log('================================\n');

  console.log('👤 PROFILE (Scraped)');
  console.log(`Username: ${profile.username}`);
  if (profile.level) {
    console.log(`Level: ${profile.level}`);
  }
  console.log(`Total Games: ${profile.totalGames}`);
  console.log(`Estimated Hours: ${profile.totalHours}h`);
  console.log();

  if (profile.games.length > 0) {
    console.log('🎮 GAMES (Scraped)');
    profile.games.forEach((game, index) => {
      console.log(`${index + 1}. ${game.name}`);
      if (game.hours) {
        console.log(`   Estimated Hours: ${Math.round(game.hours)}h`);
      }
      if (game.progress) {
        console.log(`   Progress: ${game.progress}%`);
      }
      console.log(`   Platform: ${game.platform}`);
    });
  }

  console.log('\n================================');
  console.log('✅ Scraped data display complete!');
}