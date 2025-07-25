export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}

export interface AuthResult {
  tokens?: AuthTokens;
  success: boolean;
  error?: string;
}

export async function exchangeNpssoForAccessToken(npsso: string): Promise<AuthResult> {
  try {
    console.log('Exchanging NPSSO for access code...');
    
    // Step 1: Exchange NPSSO for authorization code
    const authResponse = await fetch('https://ca.account.sony.com/api/authz/v3/oauth/authorize', {
      method: 'POST',
      headers: {
        'Cookie': `npsso=${npsso}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PlayStation App/24.0.0 (Android/13)'
      },
      body: new URLSearchParams({
        'access_type': 'offline',
        'scope': 'psn:mobile.v2.core psn:clientapp',
        'response_type': 'code',
        'client_id': 'ac8d161a-d966-4728-b0ea-ffec22f69edc',
        'redirect_uri': 'com.playstation.PlayStationApp://redirect'
      })
    });

    if (!authResponse.ok) {
      throw new Error(`Authorization failed: ${authResponse.status} ${authResponse.statusText}`);
    }

    const authData = await authResponse.json();
    
    if (!authData.code) {
      throw new Error('No authorization code received');
    }

    console.log('Authorization code obtained, exchanging for access token...');

    // Step 2: Exchange authorization code for access token
    const tokenResponse = await fetch('https://ca.account.sony.com/api/authz/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic YWM4ZDE2MWEtZDk2Ni00NzI4LWIwZWEtZmZlYzIyZjY5ZWRjOnIrRGV4NE5QdTNGbTEwVnBMbWQxaXlxOGJGZGZ5amJlN28xTVNNb2Y=',
        'User-Agent': 'PlayStation App/24.0.0 (Android/13)'
      },
      body: new URLSearchParams({
        'code': authData.code,
        'redirect_uri': 'com.playstation.PlayStationApp://redirect',
        'grant_type': 'authorization_code',
        'scope': 'psn:mobile.v2.core psn:clientapp'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();

    console.log('Access token obtained successfully');

    return {
      tokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      },
      success: true
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error'
    };
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthResult> {
  try {
    console.log('Refreshing access token...');
    
    const response = await fetch('https://ca.account.sony.com/api/authz/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic YWM4ZDE2MWEtZDk2Ni00NzI4LWIwZWEtZmZlYzIyZjY5ZWRjOnIrRGV4NE5QdTNGbTEwVnBMbWQxaXlxOGJGZGZ5amJlN28xTVNNb2Y=',
        'User-Agent': 'PlayStation App/24.0.0 (Android/13)'
      },
      body: new URLSearchParams({
        'refresh_token': refreshToken,
        'grant_type': 'refresh_token',
        'scope': 'psn:mobile.v2.core psn:clientapp'
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();

    return {
      tokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      },
      success: true
    };

  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed'
    };
  }
}