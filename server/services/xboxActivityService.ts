/**
 * Xbox Activity Service
 * Utilizes working activity endpoints from $5 OpenXBL subscription
 * Focuses on real-time activity and presence data
 */

import axios from 'axios';

export interface XboxActivity {
  id: string;
  type: 'game' | 'achievement' | 'social' | 'other';
  title: string;
  description?: string;
  gameName?: string;
  timestamp: string;
  achievement?: {
    name: string;
    description: string;
    gamerscore: number;
    rarity: string;
  };
}

export interface XboxPresence {
  xuid: string;
  state: 'Online' | 'Away' | 'Offline';
  lastSeen?: string;
  currentActivity?: {
    type: 'Game' | 'App' | 'Home';
    name: string;
    details?: string;
  };
  devices?: string[];
}

export interface ActivityHistory {
  activities: XboxActivity[];
  totalItems: number;
  pollingToken?: string;
  hasMore: boolean;
}

export class XboxActivityService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENXBL_API_KEY || '';
    if (!this.apiKey) {
      console.log('⚠️ OPENXBL_API_KEY not configured - Xbox activity features unavailable');
    }
  }

  /**
   * Get activity history - Works with $5 subscription
   */
  async getActivityHistory(): Promise<ActivityHistory> {
    if (!this.apiKey) {
      return { activities: [], totalItems: 0, hasMore: false };
    }

    try {
      console.log('📊 Getting Xbox activity history');
      
      const response = await axios.get('https://xbl.io/api/v2/activity/history', {
        headers: {
          'X-Authorization': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      const data = response.data;
      
      const activities: XboxActivity[] = (data.activityItems || []).map((item: any, index: number) => ({
        id: item.id || `activity_${index}`,
        type: this.determineActivityType(item),
        title: item.title || item.description || 'Gaming Activity',
        description: item.description,
        gameName: item.contentTitle || item.titleName,
        timestamp: item.date || item.timestamp || new Date().toISOString(),
        achievement: item.achievement ? {
          name: item.achievement.name,
          description: item.achievement.description,
          gamerscore: item.achievement.gamerscore || 0,
          rarity: item.achievement.rarity || 'Common'
        } : undefined
      }));

      console.log(`✅ Retrieved ${activities.length} activity items`);

      return {
        activities,
        totalItems: data.numItems || activities.length,
        pollingToken: data.pollingToken,
        hasMore: data.contToken !== '0' && data.contToken !== null
      };

    } catch (error: any) {
      console.error('❌ Xbox activity history fetch failed:', error.message);
      return { activities: [], totalItems: 0, hasMore: false };
    }
  }

  /**
   * Get player presence status - May work with $5 subscription
   */
  async getPlayerPresence(xuid: string): Promise<XboxPresence | null> {
    if (!this.apiKey) return null;

    try {
      console.log(`👀 Getting presence for XUID: ${xuid}`);
      
      // Try multiple presence endpoints
      const endpoints = [
        `https://xbl.io/api/v2/${xuid}/presence`,
        `https://xbl.io/api/v2/presence/${xuid}`,
        `https://xbl.io/api/v2/player/${xuid}/presence`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            headers: {
              'X-Authorization': this.apiKey,
              'Accept': 'application/json'
            },
            timeout: 8000
          });

          if (response.data) {
            const presence = response.data;
            
            return {
              xuid,
              state: presence.state || presence.presenceState || 'Offline',
              lastSeen: presence.lastSeen || presence.lastSeenDateTime,
              currentActivity: presence.activity ? {
                type: presence.activity.type || 'Game',
                name: presence.activity.name || presence.activity.titleName,
                details: presence.activity.details
              } : undefined,
              devices: presence.devices || []
            };
          }
        } catch (endpointError) {
          console.log(`⚠️ Presence endpoint ${endpoint} failed, trying next...`);
        }
      }

      console.log('❌ No working presence endpoints found');
      return null;

    } catch (error: any) {
      console.error('❌ Xbox presence fetch failed:', error.message);
      return null;
    }
  }

  /**
   * Get real-time activity feed - May work with $5 subscription
   */
  async getActivityFeed(): Promise<XboxActivity[]> {
    if (!this.apiKey) return [];

    try {
      console.log('📡 Getting Xbox activity feed');
      
      const response = await axios.get('https://xbl.io/api/v2/activity/feed', {
        headers: {
          'X-Authorization': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!response.data?.activities) {
        console.log('📭 No activity feed data available');
        return [];
      }

      const activities = response.data.activities.map((item: any, index: number) => ({
        id: item.id || `feed_${index}`,
        type: this.determineActivityType(item),
        title: item.title || 'Recent Activity',
        description: item.description,
        gameName: item.gameName || item.titleName,
        timestamp: item.timestamp || new Date().toISOString()
      }));

      console.log(`✅ Retrieved ${activities.length} feed activities`);
      return activities;

    } catch (error: any) {
      console.error('❌ Xbox activity feed fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Monitor gaming activity for a specific player
   */
  async monitorPlayerActivity(xuid: string): Promise<{
    presence: XboxPresence | null;
    recentActivity: XboxActivity[];
    isActivelyGaming: boolean;
  }> {
    console.log(`🎮 Monitoring activity for XUID: ${xuid}`);

    const [presence, activityHistory] = await Promise.all([
      this.getPlayerPresence(xuid),
      this.getActivityHistory()
    ]);

    const recentActivity = activityHistory.activities.slice(0, 5);
    const isActivelyGaming = presence?.state === 'Online' && 
                           presence?.currentActivity?.type === 'Game';

    return {
      presence,
      recentActivity,
      isActivelyGaming
    };
  }

  /**
   * Determine activity type from API response
   */
  private determineActivityType(item: any): 'game' | 'achievement' | 'social' | 'other' {
    if (item.achievement || item.type === 'achievement') return 'achievement';
    if (item.gameName || item.titleName || item.contentTitle) return 'game';
    if (item.social || item.friend) return 'social';
    return 'other';
  }
}