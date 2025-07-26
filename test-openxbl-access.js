// Test OpenXBL API access levels with current $5 subscription
const API_KEY = process.env.OPENXBL_API_KEY;
const XUID = '2535454283693482'; // Wonder Bread326's XUID

async function testEndpoint(url, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'X-Authorization': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS - Data received`);
      console.log(`📄 Response keys:`, Object.keys(data));
      
      // Check for mock data indicators
      if (data.mock === true || JSON.stringify(data).includes('"mock":true')) {
        console.log(`🚨 MOCK DATA DETECTED - Need to upgrade for real data`);
      } else {
        console.log(`🎯 REAL DATA - Your subscription covers this endpoint`);
      }
      
      // Show sample data structure
      if (data.titles && Array.isArray(data.titles)) {
        console.log(`🎮 Games found: ${data.titles.length}`);
      }
      if (data.people && Array.isArray(data.people)) {
        console.log(`👥 People found: ${data.people.length}`);
      }
      
      return { success: true, data, isMock: data.mock === true };
    } else {
      console.log(`❌ FAILED - ${response.status} ${response.statusText}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`🔍 Testing OpenXBL API Access Levels`);
  console.log(`🎮 Gamertag: Wonder Bread326`);
  console.log(`🆔 XUID: ${XUID}`);
  console.log(`💰 Current plan: $5 subscription`);
  
  const tests = [
    {
      url: `https://xbl.io/api/v2/search/Wonder%20Bread326`,
      description: 'Player Search (Basic Profile)'
    },
    {
      url: `https://xbl.io/api/v2/player/titleHistory/${XUID}`,
      description: 'Title History (Games Played) 🎯 KEY TEST'
    },
    {
      url: `https://xbl.io/api/v2/player/summary/${XUID}`,
      description: 'Player Summary (Detailed Stats)'
    },
    {
      url: `https://xbl.io/api/v2/friends`,
      description: 'Friends List (Social Data)'
    },
    {
      url: `https://xbl.io/api/v2/achievements/player/${XUID}`,
      description: 'Achievement Data'
    },
    {
      url: `https://xbl.io/api/v2/recent-players`,
      description: 'Recent Players'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.description);
    results.push({ ...test, result });
    
    // Wait between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📋 SUMMARY OF YOUR $5 SUBSCRIPTION:`);
  console.log(`════════════════════════════════════`);
  
  let realDataCount = 0;
  let mockDataCount = 0;
  let failedCount = 0;
  
  results.forEach(({ description, result }) => {
    if (result.success) {
      if (result.isMock) {
        console.log(`🔒 LOCKED: ${description} (mock data)`);
        mockDataCount++;
      } else {
        console.log(`✅ UNLOCKED: ${description} (real data)`);
        realDataCount++;
      }
    } else {
      console.log(`❌ UNAVAILABLE: ${description} (${result.status || 'error'})`);
      failedCount++;
    }
  });
  
  console.log(`\n🎯 VERDICT:`);
  console.log(`Real data endpoints: ${realDataCount}`);
  console.log(`Mock data endpoints: ${mockDataCount}`);
  console.log(`Failed endpoints: ${failedCount}`);
  
  if (mockDataCount > 0) {
    console.log(`\n💡 RECOMMENDATION: Upgrade to unlock ${mockDataCount} additional endpoints with real data`);
  } else if (realDataCount >= 4) {
    console.log(`\n🎉 GREAT! Your $5 subscription covers most features with real data`);
  } else {
    console.log(`\n⚠️ Limited access - consider upgrade for full gaming data`);
  }
}

runTests().catch(console.error);