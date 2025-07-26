// Test activity-related endpoints that work with $5 subscription
import fetch from 'node-fetch';

const API_KEY = process.env.OPENXBL_API_KEY;
const XUID = '2535454283693482'; // Wonder Bread326's XUID

async function testActivityEndpoints() {
  console.log('🎮 Testing Activity Endpoints (Working with $5 Plan)');
  console.log('==================================================');
  
  const activityEndpoints = [
    {
      url: 'https://xbl.io/api/v2/activity/history',
      name: 'Activity History',
      description: 'Gaming activity history'
    },
    {
      url: 'https://xbl.io/api/v2/activity/feed',
      name: 'Activity Feed',
      description: 'Recent activity feed'
    },
    {
      url: `https://xbl.io/api/v2/player/${XUID}/activity`,
      name: 'Player Activity',
      description: 'Specific player activity'
    },
    {
      url: 'https://xbl.io/api/v2/activity',
      name: 'General Activity',
      description: 'General activity endpoint'
    },
    {
      url: `https://xbl.io/api/v2/${XUID}/presence`,
      name: 'Player Presence',
      description: 'Current online status and what they\'re playing'
    },
    {
      url: `https://xbl.io/api/v2/presence/${XUID}`,
      name: 'Presence Status',
      description: 'Alternative presence endpoint'
    }
  ];
  
  const workingEndpoints = [];
  
  for (const endpoint of activityEndpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint.name}`);
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
        console.log(`✅ SUCCESS - Real data available`);
        console.log(`📄 Response keys: ${Object.keys(data)}`);
        
        workingEndpoints.push({
          ...endpoint,
          data: data,
          status: response.status
        });
        
        // Show useful data
        if (data.activityItems && Array.isArray(data.activityItems)) {
          console.log(`🎮 Activity items: ${data.activityItems.length}`);
        }
        if (data.numItems !== undefined) {
          console.log(`📊 Number of items: ${data.numItems}`);
        }
        if (data.state) {
          console.log(`🔄 State: ${data.state}`);
        }
        if (data.lastSeen) {
          console.log(`👀 Last seen: ${data.lastSeen}`);
        }
        
      } else {
        console.log(`❌ FAILED - ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  console.log('\n🎯 WORKING ENDPOINTS SUMMARY:');
  console.log('============================');
  
  if (workingEndpoints.length > 0) {
    console.log(`✅ Found ${workingEndpoints.length} working endpoints with your $5 plan:`);
    workingEndpoints.forEach(ep => {
      console.log(`   • ${ep.name} - Status ${ep.status}`);
    });
    
    console.log('\n💡 FEATURES WE CAN BUILD:');
    console.log('========================');
    console.log('✅ Real-time activity tracking');
    console.log('✅ Gaming session history');
    console.log('✅ Online presence monitoring');
    console.log('✅ Activity feed display');
    console.log('✅ Last played games detection');
    
  } else {
    console.log('❌ No additional working endpoints found');
    console.log('Your $5 plan is limited to basic profile and social features');
  }
}

testActivityEndpoints().catch(console.error);