// Test premium OpenXBL gaming endpoints now that you've upgraded
import fetch from 'node-fetch';

const API_KEY = process.env.OPENXBL_API_KEY;
const XUID = '2535454283693482'; // Wonder Bread326

async function testPremiumGaming() {
  console.log('🎯 Testing Premium OpenXBL Gaming Data Access');
  console.log('==============================================');
  console.log(`XUID: ${XUID}`);
  console.log('');

  // From your console screenshots, test the actual available endpoints
  const premiumEndpoints = [
    // Account endpoints (should work)
    `/api/v2/account`,
    `/api/v2/account/${XUID}`,
    
    // Gamercard and profile (key for gaming stats)
    `/api/v2/${XUID}/gamercard`,
    `/api/v2/search/${XUID}`,
    
    // Activity endpoints that should now have more data
    `/api/v2/activity/feed`,
    `/api/v2/activity/history`, 
    `/api/v2/activity/share`,
    
    // Achievement endpoints (critical for gaming data)
    `/api/v2/achievements`,
    `/api/v2/achievements/player/${XUID}`,
    
    // Gaming specific endpoints 
    `/api/v2/generate/gamertag`,
    `/api/v2/${XUID}/presence`,
    
    // DVR and clips (bonus gaming content)
    `/api/v2/dvr/screenshots`,
    `/api/v2/dvr/gameclips`
  ];
  
  const workingEndpoints = [];
  const gamingDataFound = [];
  
  for (const endpoint of premiumEndpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      
      const response = await fetch(`https://xbl.io${endpoint}`, {
        headers: {
          'X-Authorization': API_KEY,
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS - Data available`);
        console.log(`   Keys: ${Object.keys(data).slice(0, 5).join(', ')}`);
        
        workingEndpoints.push({
          endpoint,
          status: response.status,
          data: data
        });
        
        // Look for gaming-specific data
        if (data.games || data.titles || data.hoursPlayed || data.lastPlayed) {
          console.log(`   🎮 GAMING DATA FOUND!`);
          gamingDataFound.push({ endpoint, data });
        }
        
        if (data.activityItems && data.activityItems.length > 0) {
          console.log(`   📈 Activity: ${data.activityItems.length} items`);
        }
        
        if (data.gamerScore || data.gamerscore) {
          console.log(`   🏆 Gamerscore: ${data.gamerScore || data.gamerscore}`);
        }
        
      } else if (response.status === 402) {
        console.log(`   💰 PAYMENT REQUIRED - Need higher tier?`);
      } else if (response.status === 404) {
        console.log(`   ❌ NOT FOUND`);
      } else {
        console.log(`   ❌ ERROR: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  
  // Summary
  console.log('\n🎯 PREMIUM UPGRADE RESULTS:');
  console.log('===========================');
  console.log(`✅ Working endpoints: ${workingEndpoints.length}`);
  console.log(`🎮 Gaming data endpoints: ${gamingDataFound.length}`);
  
  if (gamingDataFound.length > 0) {
    console.log('\n🎮 GAMING DATA AVAILABLE:');
    gamingDataFound.forEach(item => {
      console.log(`   • ${item.endpoint}`);
    });
    console.log('\n🚀 READY TO BUILD: Hours, dates, and games data now accessible!');
  } else {
    console.log('\n⚠️  May need to check specific gaming endpoints or wait for upgrade activation');
  }
}

testPremiumGaming().catch(console.error);