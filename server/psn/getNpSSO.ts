import puppeteer from 'puppeteer';

export interface NpssoResult {
  npsso: string;
  success: boolean;
  error?: string;
}

export async function getNpssoWithPuppeteer(email: string, password: string): Promise<NpssoResult> {
  let browser;
  
  try {
    console.log('Launching browser for PlayStation login...');
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
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('Navigating to PlayStation login...');
    await page.goto('https://my.playstation.com/auth/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for login form and fill credentials
    console.log('Waiting for login form...');
    await page.waitForSelector('#loginId', { timeout: 10000 });
    
    await page.type('#loginId', email);
    await page.type('#password', password);
    
    console.log('Submitting login form...');
    await page.click('#signin-button');
    
    // Wait for successful login (redirect or dashboard)
    console.log('Waiting for login completion...');
    await page.waitForNavigation({ 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Check if we're successfully logged in
    const currentUrl = page.url();
    if (currentUrl.includes('error') || currentUrl.includes('login')) {
      throw new Error('Login failed - check credentials');
    }
    
    console.log('Login successful, extracting NPSSO cookie...');
    
    // Get all cookies from the page
    const cookies = await page.cookies();
    
    // Find the NPSSO cookie
    const npssoCookie = cookies.find(cookie => cookie.name === 'npsso');
    
    if (!npssoCookie) {
      // Try to navigate to the API endpoint to trigger cookie creation
      console.log('NPSSO cookie not found, trying API endpoint...');
      await page.goto('https://ca.account.sony.com/api/v1/ssocookie', {
        waitUntil: 'networkidle2'
      });
      
      const updatedCookies = await page.cookies();
      const retryNpssoCookie = updatedCookies.find(cookie => cookie.name === 'npsso');
      
      if (!retryNpssoCookie) {
        throw new Error('NPSSO cookie not found after login');
      }
      
      return {
        npsso: retryNpssoCookie.value,
        success: true
      };
    }
    
    console.log('NPSSO token extracted successfully');
    return {
      npsso: npssoCookie.value,
      success: true
    };
    
  } catch (error) {
    console.error('Error during PlayStation login:', error);
    return {
      npsso: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function validateNpssoToken(npsso: string): Promise<boolean> {
  try {
    // Test the NPSSO token by making a simple API call
    const response = await fetch('https://ca.account.sony.com/api/authz/v3/oauth/authorize', {
      method: 'POST',
      headers: {
        'Cookie': `npsso=${npsso}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'access_type': 'offline',
        'scope': 'psn:mobile.v2.core psn:clientapp',
        'response_type': 'code',
        'client_id': 'ac8d161a-d966-4728-b0ea-ffec22f69edc',
        'redirect_uri': 'com.playstation.PlayStationApp://redirect'
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('NPSSO validation failed:', error);
    return false;
  }
}