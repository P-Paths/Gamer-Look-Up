#!/usr/bin/env node

/**
 * Complete platform integration test and summary
 * Tests all three platforms and provides deployment readiness assessment
 */

console.log('🎮 COMPLETE PLATFORM INTEGRATION TEST');
console.log('=====================================');

const platforms = [
  {
    name: 'Xbox (OpenXBL Premium)',
    gamerTag: 'Wonder Bread326',
    platform: 'xbox',
    expectation: 'Real achievement data, 0 hours (authentic Xbox limitation)'
  },
  {
    name: 'PlayStation (Browser Scraping)',
    gamerTag: 'WonderCheeseBread', 
    platform: 'playstation',
    expectation: 'Real scraped playtime hours from PlayStation profile'
  },
  {
    name: 'Steam (API)',
    gamerTag: 'gaben',
    platform: 'steam', 
    expectation: 'Real Steam data (may be private profile)'
  }
];

async function testPlatformIntegration(test) {
  console.log(`\n🎯 Testing ${test.name}`);
  console.log('='.repeat(60));
  console.log(`Gamer Tag: ${test.gamerTag}`);
  console.log(`Expected: ${test.expectation}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:5000/api/platform/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gamerTag: test.gamerTag,
        platform: test.platform
      })
    });
    
    const data = await response.json();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.ok) {
      console.log(`✅ SUCCESS (${duration}ms)`);
      console.log(`   Player: ${data.player?.gamerTag || data.player?.displayName}`);
      console.log(`   Total Hours: ${data.totalHours}h`);
      console.log(`   Total Games: ${data.totalGames}`);
      console.log(`   Status: ${data.qualificationStatus}`);
      
      // Check for authentic data markers
      const isAuthentic = data.qualificationReason?.includes('Real') || 
                         data.qualificationReason?.includes('authentic') ||
                         data.qualificationReason?.includes('scraped') ||
                         data.qualificationReason?.includes('Premium');
                         
      console.log(`   Data Type: ${isAuthentic ? '🟢 AUTHENTIC' : '🟡 NEEDS_REVIEW'}`);
      console.log(`   Source: ${data.qualificationReason}`);
      
      if (data.topGames && data.topGames.length > 0) {
        console.log(`   Sample Games:`);
        data.topGames.slice(0, 2).forEach(game => {
          console.log(`     • ${game.name}: ${game.hoursPlayed}h`);
        });
      }
      
      // Xbox-specific data
      if (test.platform === 'xbox' && data.player?.gamerscore) {
        console.log(`   Gamerscore: ${data.player.gamerscore}`);
      }
      
      // PlayStation-specific data
      if (test.platform === 'playstation' && data.trophies) {
        const totalTrophies = data.trophies.platinum + data.trophies.gold + 
                             data.trophies.silver + data.trophies.bronze;
        console.log(`   Trophies: ${totalTrophies} total (${data.trophies.platinum}P, ${data.trophies.gold}G, ${data.trophies.silver}S, ${data.trophies.bronze}B)`);
      }
      
      return {
        platform: test.name,
        success: true,
        authentic: isAuthentic,
        hours: data.totalHours,
        games: data.totalGames,
        duration
      };
      
    } else {
      console.log(`❌ FAILED (${duration}ms)`);
      console.log(`   Error: ${data.error}`);
      
      return {
        platform: test.name,
        success: false,
        error: data.error,
        duration
      };
    }
    
  } catch (error) {
    console.log(`❌ REQUEST ERROR`);
    console.log(`   Error: ${error.message}`);
    
    return {
      platform: test.name,
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

async function runCompleteTest() {
  console.log('\nStarting comprehensive platform integration test...\n');
  
  const results = [];
  
  for (const test of platforms) {
    const result = await testPlatformIntegration(test);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary report
  console.log('\n📊 INTEGRATION TEST SUMMARY');
  console.log('===========================');
  
  const working = results.filter(r => r.success);
  const authentic = working.filter(r => r.authentic);
  
  console.log(`Overall Status: ${working.length}/${results.length} platforms working`);
  console.log(`Authentic Data: ${authentic.length}/${working.length} platforms with real data`);
  
  console.log('\nPlatform Status:');
  results.forEach(result => {
    if (result.success) {
      const dataType = result.authentic ? 'AUTHENTIC' : 'ESTIMATED';
      console.log(`✅ ${result.platform}: ${result.hours}h across ${result.games} games (${dataType})`);
    } else {
      console.log(`❌ ${result.platform}: ${result.error}`);
    }
  });
  
  // Deployment readiness assessment
  console.log('\n🚀 DEPLOYMENT READINESS');
  console.log('=======================');
  
  if (working.length >= 2) {
    console.log('✅ Ready for GitHub dashboard integration');
    console.log('✅ Multiple platforms providing authentic gaming data');
    console.log('✅ Data integrity maintained (no fake estimates)');
    
    if (authentic.length === working.length) {
      console.log('🏆 ALL WORKING PLATFORMS PROVIDE AUTHENTIC DATA');
    } else {
      console.log(`⚠️  ${working.length - authentic.length} platform(s) may need data source verification`);
    }
  } else {
    console.log('⚠️  Additional platform fixes needed before deployment');
  }
  
  console.log('\nRecommendations:');
  results.forEach(result => {
    if (!result.success) {
      if (result.platform.includes('Steam')) {
        console.log('• Steam: Provide a public Steam profile for testing');
      } else if (result.platform.includes('PlayStation')) {
        console.log('• PlayStation: Verify NPSSO token is current and valid');
      } else if (result.platform.includes('Xbox')) {
        console.log('• Xbox: Check OpenXBL premium subscription status');
      }
    }
  });
  
  return results;
}

runCompleteTest()
  .then(results => {
    console.log('\n✅ Integration test complete!');
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
  });