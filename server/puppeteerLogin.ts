/**
 * Puppeteer PlayStation Login Automation
 * WARNING: For internal/staff use only - not for production user flows
 */

import puppeteer from 'puppeteer';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  npssoToken?: string;
  error?: string;
}

export async function automatePlayStationLogin(credentials: LoginCredentials): Promise<LoginResult> {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to PlayStation login
    await page.goto('https://ca.account.sony.com/api/v1/ssocookie', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Check if we're redirected to login page
    const currentUrl = page.url();
    if (currentUrl.includes('signin')) {
      
      // Fill in credentials
      await page.waitForSelector('#signin-email', { timeout: 10000 });
      await page.type('#signin-email', credentials.username);
      
      await page.waitForSelector('#signin-password', { timeout: 10000 });
      await page.type('#signin-password', credentials.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation or 2FA challenge
      await page.waitForNavigation({ 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Check for 2FA requirement
      const is2FARequired = await page.$('#twoStepVerification') !== null;
      if (is2FARequired) {
        await browser.close();
        return {
          success: false,
          error: '2FA required - manual login needed'
        };
      }
    }

    // Extract NPSSO token from cookies
    const cookies = await page.cookies();
    const npssoCookie = cookies.find(cookie => cookie.name === 'npsso');
    
    if (!npssoCookie || !npssoCookie.value) {
      await browser.close();
      return {
        success: false,
        error: 'NPSSO token not found in cookies'
      };
    }

    await browser.close();
    
    return {
      success: true,
      npssoToken: npssoCookie.value
    };

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login automation failed'
    };
  }
}

// Validate extracted token
export async function validateExtractedToken(npssoToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://ca.account.sony.com/api/authz/v3/oauth/authorize', {
      method: 'POST',
      headers: {
        'Cookie': `npsso=${npssoToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'access_type': 'offline',
        'client_id': '09515159-7237-4370-9b40-3806e67c0891',
        'response_type': 'code',
        'scope': 'psn:mobile.v2.core psn:clientapp',
        'redirect_uri': 'com.scee.psxandroid.scecompcall://redirect'
      })
    });

    return response.status === 200;
  } catch {
    return false;
  }
}