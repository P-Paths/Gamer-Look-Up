// Test the exact endpoints visible in the OpenXBL console screenshot
import fetch from 'node-fetch';

const API_KEY = process.env.OPENXBL_API_KEY;

async function testConsoleEndpoints() {
  console.log('🎮 Testing Exact OpenXBL Console Endpoints');
  console.log('=========================================');
  
  // From your console screenshot, these endpoints are visible:
  const consoleEndpoints = [
    '/api/v2/account',
    '/api/v2/account/',  
    '/api/v2/search/',
    '/api/v2/alerts/',
    '/api/v2/generate/gamertag',
    '/api/v2/{xuid}/presence'
  ];
  
  // Test basic account endpoint
  console.log('\n📡 Testing: Account Info');
  try {
    const response = await fetch('https://xbl.io/api/v2/account', {
      headers: {
        'X-Authorization': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Account data available:');
      console.log(`   Keys: ${Object.keys(data)}`);
      
      // Look for gaming-related info in account data
      if (data.gamertag) console.log(`   Gamertag: ${data.gamertag}`);
      if (data.gamerScore) console.log(`   Gamerscore: ${data.gamerScore}`);
      if (data.accountTier) console.log(`   Account Tier: ${data.accountTier}`);
      if (data.subscription) console.log(`   Subscription: ${data.subscription}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n🎯 WHAT TO CHECK IN OPENXBL CONSOLE:');
  console.log('====================================');
  console.log('1. Look for endpoints that return status 200 (green)');
  console.log('2. Check if any gaming endpoints show "Try it" buttons');
  console.log('3. Look for subscription tier information');
  console.log('4. Test these specific endpoints in the console:');
  console.log('   • /api/v2/player/{xuid}/games');
  console.log('   • /api/v2/player/{xuid}/activity');  
  console.log('   • /api/v2/player/{xuid}/achievements');
  console.log('   • /api/v2/recent-games/{xuid}');
  
  console.log('\n💰 SUBSCRIPTION OPTIONS:');
  console.log('========================');
  console.log('Option 1: Upgrade OpenXBL to Medium plan (~$15-30)');
  console.log('   → Unlocks real Xbox games and hours data');
  console.log('   → Best for comprehensive gaming statistics');
  
  console.log('\nOption 2: Keep $5 plan, focus on social features');
  console.log('   → Build Xbox friends management');
  console.log('   → Player search and comparison tools');
  console.log('   → Profile browsing and discovery');
  
  console.log('\nOption 3: Alternative Xbox API services');
  console.log('   → Research other Xbox Live API providers');
  console.log('   → Microsoft\'s official Xbox Live API (if available)');
}

testConsoleEndpoints().catch(console.error);