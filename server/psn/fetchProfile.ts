export interface PSNProfile {
  onlineId: string;
  accountId: string;
  npId: string;
  avatarUrls: {
    size: string;
    avatarUrl: string;
  }[];
  plus: number;
  aboutMe: string;
  languagesUsed: string[];
  trophySummary: {
    level: number;
    progress: number;
    earnedTrophies: {
      platinum: number;
      gold: number;
      silver: number;
      bronze: number;
    };
  };
  presences?: {
    platform: string;
    lastOnlineDate: string;
    hasBroadcastData: boolean;
  }[];
  country: string;
  state: string;
  isPlus: boolean;
}

export interface ProfileResult {
  profile?: PSNProfile;
  success: boolean;
  error?: string;
}

export async function fetchPSNProfile(accessToken: string, accountId?: string): Promise<ProfileResult> {
  try {
    console.log('Fetching PlayStation profile...');
    
    // If no accountId provided, get current user's profile
    const targetAccountId = accountId || 'me';
    
    const response = await fetch(`https://us-prof.np.community.playstation.net/userProfile/v1/users/${targetAccountId}/profile2`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept-Language': 'en-US',
        'User-Agent': 'PlayStation App/24.0.0 (Android/13)'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Access token expired or invalid');
      }
      throw new Error(`Profile fetch failed: ${response.status} ${response.statusText}`);
    }

    const profileData = await response.json();
    
    if (!profileData.profile) {
      throw new Error('No profile data received');
    }

    console.log('PlayStation profile fetched successfully');
    
    return {
      profile: {
        onlineId: profileData.profile.onlineId,
        accountId: profileData.profile.accountId,
        npId: profileData.profile.npId,
        avatarUrls: profileData.profile.avatarUrls || [],
        plus: profileData.profile.plus || 0,
        aboutMe: profileData.profile.aboutMe || '',
        languagesUsed: profileData.profile.languagesUsed || [],
        trophySummary: {
          level: profileData.profile.trophySummary?.level || 0,
          progress: profileData.profile.trophySummary?.progress || 0,
          earnedTrophies: {
            platinum: profileData.profile.trophySummary?.earnedTrophies?.platinum || 0,
            gold: profileData.profile.trophySummary?.earnedTrophies?.gold || 0,
            silver: profileData.profile.trophySummary?.earnedTrophies?.silver || 0,
            bronze: profileData.profile.trophySummary?.earnedTrophies?.bronze || 0
          }
        },
        presences: profileData.profile.presences || [],
        country: profileData.profile.country || '',
        state: profileData.profile.state || '',
        isPlus: profileData.profile.plus > 0
      },
      success: true
    };

  } catch (error) {
    console.error('Profile fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Profile fetch failed'
    };
  }
}

export async function searchPSNUser(accessToken: string, onlineId: string): Promise<ProfileResult> {
  try {
    console.log(`Searching for PlayStation user: ${onlineId}`);
    
    const response = await fetch(`https://us-prof.np.community.playstation.net/userProfile/v1/users/${onlineId}/profile2`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept-Language': 'en-US',
        'User-Agent': 'PlayStation App/24.0.0 (Android/13)'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User '${onlineId}' not found`);
      }
      if (response.status === 401) {
        throw new Error('Access token expired or invalid');
      }
      throw new Error(`User search failed: ${response.status} ${response.statusText}`);
    }

    const profileData = await response.json();
    
    return {
      profile: profileData.profile,
      success: true
    };

  } catch (error) {
    console.error('User search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'User search failed'
    };
  }
}

export async function getUserAccountId(accessToken: string): Promise<string | null> {
  try {
    const result = await fetchPSNProfile(accessToken);
    return result.profile?.accountId || null;
  } catch (error) {
    console.error('Error getting account ID:', error);
    return null;
  }
}