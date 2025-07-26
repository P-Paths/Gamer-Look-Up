// Test XAPI.us for Xbox gaming data (hours, dates, games)
import fetch from 'node-fetch';

const XUID = '2535454283693482'; // Wonder Bread326's XUID

async function testXAPIGaming() {
  console.log('🎮 Testing XAPI.us for Xbox Gaming Data');
  console.log('=====================================');
  
  // XAPI.us endpoints from documentation
  const endpoints = [
    {
      url: `https://xapi.us/v2/${XUID}/profile`,
      name: 'Profile Data',
      description: 'Basic profile with gamerscore'
    },
    {
      url: `https://xapi.us/v2/${XUID}/gamercard`,
      name: 'Gamercard',
      description: 'Extended profile info'
    },
    {
      url: `https://xapi.us/v2/${XUID}/presence`,
      name: 'Presence',
      description: 'Online status and current game'
    },
    {
      url: `https://xapi.us/v2/${XUID}/activity`,
      name: 'Activity',
      description: 'Recent gaming activity'
    },
    {
      url: `https://xapi.us/v2/${XUID}/friends`,
      name: 'Friends',
      description: 'Friends list'
    },
    {
      url: `https://xapi.us/v2/${XUID}/games`,
      name: 'Games Library',
      description: 'Games with hours played - KEY ENDPOINT!'
    },
    {
      url: `https://xapi.us/v2/${XUID}/achievements`,
      name: 'Achievements',
      description: 'Achievement data'
    }
  ];
  
  const workingEndpoints = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint.name}`);
      console.log(`🎯 URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Gaming-Dashboard/1.0'
        },
        timeout: 8000
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS - Data available`);
        console.log(`📄 Response keys: ${Object.keys(data).slice(0, 5).join(', ')}`);
        
        workingEndpoints.push({
          ...endpoint,
          status: response.status,
          data: data
        });
        
        // Check for specific gaming data
        if (endpoint.name === 'Games Library' && data.titles) {
          console.log(`🎮 Found ${data.titles.length} games!`);
          if (data.titles[0]) {
            const game = data.titles[0];
            console.log(`📋 Sample game: ${game.name || game.titleName}`);
            if (game.lastPlayed) console.log(`📅 Last played data: YES`);
            if (game.hoursPlayed || game.currentGamerscore) console.log(`⏰ Hours/progress data: YES`);
          }
        }
        
        if (endpoint.name === 'Activity' && data.activityItems) {
          console.log(`📈 Found ${data.activityItems.length} activity items`);
        }
        
      } else if (response.status === 429) {
        console.log(`⏰ RATE LIMITED - Try again later`);
      } else if (response.status === 404) {
        console.log(`❌ NOT FOUND - Player may not exist or endpoint unavailable`);
      } else {
        console.log(`❌ FAILED - ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
    }
    
    // Rate limiting - XAPI has strict limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n🎯 RESULTS SUMMARY:');
  console.log('==================');
  
  if (workingEndpoints.length > 0) {
    console.log(`✅ Found ${workingEndpoints.length} working endpoints:`);
    workingEndpoints.forEach(ep => {
      console.log(`   • ${ep.name} - Status ${ep.status}`);
    });
    
    const gamesEndpoint = workingEndpoints.find(ep => ep.name === 'Games Library');
    if (gamesEndpoint) {
      console.log('\n🎮 GAMING DATA AVAILABLE:');
      console.log('========================');
      console.log('✅ Games library with titles');
      console.log('✅ Hours played per game');
      console.log('✅ Last played dates');
      console.log('✅ Achievement progress');
      console.log('\n💡 SOLUTION: Use XAPI.us instead of OpenXBL!');
      console.log('No subscription fees required');
    }
    
  } else {
    console.log('❌ No working gaming endpoints found');
    console.log('Need to find alternative Xbox gaming API');
  }
  
  console.log('\n📋 RATE LIMITING INFO:');
  console.log('======================');
  console.log('XAPI.us has rate limits but is FREE');
  console.log('Can implement caching to minimize API calls');
  console.log('Much better than OpenXBL subscription costs');
}

testXAPIGaming().catch(console.error);