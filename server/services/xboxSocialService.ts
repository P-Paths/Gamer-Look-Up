/**
 * Xbox Social Service
 * Optimized for $5 OpenXBL subscription - maximizes social features available
 * Covers: Friends, Recent Players, Profile Search, Player Comparison
 */

import axios from 'axios';

export interface XboxSocialProfile {
  xuid: string;
  gamertag: string;
  displayName?: string;
  gamerscore: number;
  avatar?: string;
  bio?: string;
  location?: string;
  tenure?: string;
  followerCount?: number;
  followingCount?: number;
  isOnline?: boolean;
  lastSeen?: string;
  preferredColor?: {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
  };
}

export interface XboxFriend extends XboxSocialProfile {
  relationship: 'friend' | 'follower' | 'following';
  addedDate?: string;
}

export interface XboxRecentPlayer extends XboxSocialProfile {
  lastPlayedWith?: string;
  gamePlayed?: string;
  minutesPlayed?: number;
}

export class XboxSocialService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENXBL_API_KEY || '';
    if (!this.apiKey) {
      console.log('⚠️ OPENXBL_API_KEY not configured - Xbox social features unavailable');
    }
  }

  /**
   * Search for Xbox players by gamertag - Works with $5 subscription
   */
  async searchPlayers(query: string): Promise<XboxSocialProfile[]> {
    if (!this.apiKey) return [];

    try {
      console.log(`🔍 Searching Xbox players for: ${query}`);
      
      const response = await axios.get(`https://xbl.io/api/v2/search/${encodeURIComponent(query)}`, {
        headers: {
          'X-Authorization': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!response.data?.people) {
        console.log('❌ No players found in search');
        return [];
      }

      const players = response.data.people.map((person: any) => ({
        xuid: person.xuid,
        gamertag: person.gamertag,
        displayName: person.displayName || person.gamertag,
        gamerscore: parseInt(person.gamerScore) || 0,
        avatar: person.displayPicRaw,
        bio: person.bio,
        location: person.location,
        isOnline: person.presenceState === 'Online',
        preferredColor: person.preferredColor
      }));

      console.log(`✅ Found ${players.length} Xbox players`);
      return players;

    } catch (error: any) {
      console.error('❌ Xbox player search failed:', error.message);
      return [];
    }
  }

  /**
   * Get detailed profile for specific Xbox player - Works with $5 subscription
   */
  async getPlayerProfile(gamertagOrXuid: string): Promise<XboxSocialProfile | null> {
    if (!this.apiKey) return null;

    try {
      console.log(`👤 Getting Xbox profile for: ${gamertagOrXuid}`);
      
      // First search to get the player
      const searchResults = await this.searchPlayers(gamertagOrXuid);
      if (searchResults.length === 0) {
        console.log('❌ Player not found');
        return null;
      }

      const player = searchResults[0];
      
      // Try to get more detailed profile info
      try {
        const profileResponse = await axios.get(`https://xbl.io/api/v2/player/summary/${player.xuid}`, {
          headers: {
            'X-Authorization': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        if (profileResponse.data?.people?.[0]) {
          const detailedPlayer = profileResponse.data.people[0];
          return {
            ...player,
            followerCount: detailedPlayer.followerCount,
            followingCount: detailedPlayer.followingCount,
            tenure: detailedPlayer.accountTier
          };
        }
      } catch (summaryError) {
        console.log('⚠️ Could not get detailed profile, using basic info');
      }

      return player;

    } catch (error: any) {
      console.error('❌ Xbox profile fetch failed:', error.message);
      return null;
    }
  }

  /**
   * Get Xbox friends list - Works with $5 subscription
   */
  async getFriends(): Promise<XboxFriend[]> {
    if (!this.apiKey) return [];

    try {
      console.log('👥 Getting Xbox friends list');
      
      const response = await axios.get('https://xbl.io/api/v2/friends', {
        headers: {
          'X-Authorization': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (!response.data?.people) {
        console.log('❌ No friends data received');
        return [];
      }

      const friends = response.data.people.map((friend: any) => ({
        xuid: friend.xuid,
        gamertag: friend.gamertag,
        displayName: friend.displayName || friend.gamertag,
        gamerscore: parseInt(friend.gamerScore) || 0,
        avatar: friend.displayPicRaw,
        bio: friend.bio,
        location: friend.location,
        isOnline: friend.presenceState === 'Online',
        lastSeen: friend.lastSeen,
        relationship: 'friend' as const,
        preferredColor: friend.preferredColor
      }));

      console.log(`✅ Retrieved ${friends.length} Xbox friends`);
      return friends;

    } catch (error: any) {
      console.error('❌ Xbox friends fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Get recent players - Works with $5 subscription  
   */
  async getRecentPlayers(): Promise<XboxRecentPlayer[]> {
    if (!this.apiKey) return [];

    try {
      console.log('🎮 Getting recent Xbox players');
      
      const response = await axios.get('https://xbl.io/api/v2/recent-players', {
        headers: {
          'X-Authorization': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (!response.data?.people) {
        console.log('❌ No recent players data received');
        return [];
      }

      const recentPlayers = response.data.people.map((player: any) => ({
        xuid: player.xuid,
        gamertag: player.gamertag,
        displayName: player.displayName || player.gamertag,
        gamerscore: parseInt(player.gamerScore) || 0,
        avatar: player.displayPicRaw,
        bio: player.bio,
        isOnline: player.presenceState === 'Online',
        lastSeen: player.lastSeen,
        lastPlayedWith: player.lastEncounter,
        gamePlayed: player.encounter?.titleName,
        preferredColor: player.preferredColor
      }));

      console.log(`✅ Retrieved ${recentPlayers.length} recent Xbox players`);
      return recentPlayers;

    } catch (error: any) {
      console.error('❌ Recent Xbox players fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Compare two Xbox players - Works with $5 subscription
   */
  async comparePlayers(gamertag1: string, gamertag2: string): Promise<{
    player1: XboxSocialProfile | null;
    player2: XboxSocialProfile | null;
    comparison: {
      gamerscoreDifference: number;
      winner: string | null;
      bothOnline: boolean;
    };
  }> {
    console.log(`⚖️ Comparing Xbox players: ${gamertag1} vs ${gamertag2}`);

    const [player1, player2] = await Promise.all([
      this.getPlayerProfile(gamertag1),
      this.getPlayerProfile(gamertag2)
    ]);

    let comparison = {
      gamerscoreDifference: 0,
      winner: null as string | null,
      bothOnline: false
    };

    if (player1 && player2) {
      comparison.gamerscoreDifference = Math.abs(player1.gamerscore - player2.gamerscore);
      comparison.winner = player1.gamerscore > player2.gamerscore 
        ? player1.gamertag 
        : player2.gamerscore > player1.gamerscore 
          ? player2.gamertag 
          : 'Tie';
      comparison.bothOnline = (player1.isOnline && player2.isOnline) || false;
    }

    return { player1, player2, comparison };
  }

  /**
   * Get comprehensive social data for display
   */
  async getSocialDashboard(): Promise<{
    friends: XboxFriend[];
    recentPlayers: XboxRecentPlayer[];
    onlineFriends: XboxFriend[];
    totalConnections: number;
  }> {
    console.log('📊 Getting Xbox social dashboard');

    const [friends, recentPlayers] = await Promise.all([
      this.getFriends(),
      this.getRecentPlayers()
    ]);

    const onlineFriends = friends.filter(friend => friend.isOnline);

    return {
      friends,
      recentPlayers,
      onlineFriends,
      totalConnections: friends.length + recentPlayers.length
    };
  }
}