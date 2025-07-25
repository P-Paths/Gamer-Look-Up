/**
 * NPSSO Token Validation Module
 * Checks if a PlayStation NPSSO token is still valid
 */

export async function validateNpssoToken(npssoToken: string): Promise<boolean> {
  try {
    if (!npssoToken || npssoToken.trim().length === 0) {
      return false;
    }

    // Test token by making a simple API call to PlayStation
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

    // If we get a 200 response, token is valid
    return response.status === 200;
    
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

export function isTokenExpired(lastUpdated: Date): boolean {
  const now = new Date();
  const diffInDays = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  
  // Consider token expired after 30 days (conservative estimate)
  return diffInDays > 30;
}