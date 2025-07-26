// Test specific gaming endpoints to see what your $5 subscription covers
import fetch from 'node-fetch';

const API_KEY = process.env.OPENXBL_API_KEY;
const XUID = '2535454283693482'; // Wonder Bread326's XUID

async function testGamingEndpoints() {
  console.log('🎮 Testing OpenXBL Gaming Endpoints for $5 Subscription');
  console.log('====================================================');
  
  // These are the gaming endpoints from OpenXBL console
  const gamingEndpoints = [
    {
      url: `https://xbl.io/api/v2/player/${XUID}/games`,
      name: 'Player Games Library',
      description: 'List of games owned'
    },
    {
      url: `https://xbl.io/api/v2/player/${XUID}/activity`,
      name: 'Player Activity',
      description: 'Recent gaming activity'
    },
    {
      url: `https://xbl.io/api/v2/player/${XUID}/achievements`,
      name: 'Player Achievements',
      description: 'Achievement data'
    },
    {
      url: `https://xbl.io/api/v2/player/${XUID}/stats`,
      name: 'Player Stats',
      description: 'Gaming statistics'
    },
    {
      url: `https://xbl.io/api/v2/player/${XUID}/titles`,
      name: 'Player Titles',
      description: 'Game titles with playtime'
    },
    {
      url: `https://xbl.io/api/v2/player/${XUID}/titlehistory`,
      name: 'Title History',
      description: 'Historical game data'
    },
    {
      url: `https://xbl.io/api/v2/player/${XUID}/gamercard`,
      name: 'Gamercard',
      description: 'Profile card with stats'
    }
  ];
  
  console.log(`\n🔍 Testing ${gamingEndpoints.length} gaming endpoints...\n`);
  
  for (const endpoint of gamingEndpoints) {
    try {
      console.log(`📡 Testing: ${endpoint.name}`);
      console.log(`🎯 URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        headers: {
          'X-Authorization': API_KEY,
          'Accept': 'application/json'
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS - Data available`);
        
        // Check for mock data
        if (data.mock === true || JSON.stringify(data).includes('"mock":true')) {
          console.log(`🚨 MOCK DATA - Need subscription upgrade`);
        } else {
          console.log(`🎯 REAL DATA - Your $5 plan covers this!`);
          
          // Show sample of what's available
          if (data.titles && Array.isArray(data.titles)) {
            console.log(`🎮 Found ${data.titles.length} games`);
          }
          if (data.games && Array.isArray(data.games)) {
            console.log(`🎮 Found ${data.games.length} games`);
          }
          if (data.activities && Array.isArray(data.activities)) {
            console.log(`📈 Found ${data.activities.length} activities`);
          }
        }
      } else if (response.status === 402) {
        console.log(`💰 PAYMENT REQUIRED - Need subscription upgrade`);
      } else if (response.status === 403) {
        console.log(`🔒 FORBIDDEN - Not available on your plan`);
      } else {
        console.log(`❌ FAILED - ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line between tests
    
    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n💡 SUBSCRIPTION RECOMMENDATIONS:');
  console.log('================================');
  console.log('If most endpoints return 402/403/mock data:');
  console.log('→ Upgrade to OpenXBL Medium plan (~$15-30/month)');
  console.log('→ This unlocks real games library and playtime data');
  console.log('→ Perfect for your gaming statistics application');
  
  console.log('\nIf some endpoints work with real data:');
  console.log('→ Your $5 plan may cover basic gaming features');
  console.log('→ We can build features around what works');
  console.log('→ Focus on social and profile features');
}

testGamingEndpoints().catch(console.error);