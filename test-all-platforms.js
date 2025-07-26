#!/usr/bin/env node

/**
 * Test script for all gaming platform integrations
 * Tests Steam, Xbox, and PlayStation lookups with real data
 */

console.log('🧪 Gaming Platform Integration Test Suite');
console.log('==========================================');

const platforms = [
  { 
    name: 'Steam', 
    gamerTag: 'gaben',  // Use a known working Steam profile
    platform: 'steam',
    expected: 'Should return real Steam games and hours (may be private)'
  },
  { 
    name: 'Xbox (OpenXBL)', 
    gamerTag: 'Wonder Bread326', 
    platform: 'xbox',
    expected: 'Should return real games but 0 hours (Xbox limitation)'
  },
  {
    name: 'PlayStation (Browser Scraping)',
    gamerTag: 'WonderCheeseBread',
    platform: 'playstation',
    expected: 'Should return real scraped playtime hours from PlayStation profile'
  }
];

async function testPlatform(test) {
  console.log(`\n🎮 Testing ${test.name}: ${test.gamerTag}`);
  console.log('='.repeat(50));
  console.log(`Expected: ${test.expected}`);
  
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
    
    if (response.ok) {
      console.log(`✅ ${test.name} SUCCESS`);
      console.log(`   Player: ${data.player?.gamerTag || data.player?.displayName}`);
      console.log(`   Total Hours: ${data.totalHours}h`);
      console.log(`   Total Games: ${data.totalGames}`);
      console.log(`   Data Quality: ${data.qualificationStatus || 'unknown'}`);
      
      if (data.topGames && data.topGames.length > 0) {
        console.log(`   Sample Games:`);
        data.topGames.slice(0, 3).forEach(game => {
          console.log(`     • ${game.name}: ${game.hoursPlayed}h`);
        });
      }
      
      return { success: true, platform: test.name, data };
    } else {
      console.log(`❌ ${test.name} FAILED: ${data.error}`);
      return { success: false, platform: test.name, error: data.error };
    }
  } catch (error) {
    console.log(`❌ ${test.name} ERROR: ${error.message}`);
    return { success: false, platform: test.name, error: error.message };
  }
}

async function runAllTests() {
  const results = [];
  
  for (const test of platforms) {
    const result = await testPlatform(test);
    results.push(result);
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`Overall: ${passed}/${total} platforms working`);
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.platform}: Working with authentic data`);
    } else {
      console.log(`❌ ${result.platform}: ${result.error}`);
    }
  });
  
  if (passed === total) {
    console.log('\n🎉 All platform integrations working!');
    console.log('Ready for GitHub dashboard integration.');
  } else {
    console.log(`\n⚠️  ${total - passed} platform(s) need attention before deployment.`);
  }
}

runAllTests().catch(console.error);