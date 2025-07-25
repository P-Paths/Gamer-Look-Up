/**
 * Comprehensive PlayStation Multi-Source Data Test
 * Tests all available PlayStation data sources to verify real data retrieval
 */

import { MultiSourcePSNData } from './dist/server/psn/multiSourcePSN.js';

async function testMultiSourcePSN() {
  console.log('🎯 PlayStation Multi-Source Data Test');
  console.log('=====================================\n');

  // Test gamer tags (mix of known public profiles)
  const testGamerTags = [
    'lazaruz_729',
    'test_user123',
    'sony_gamer',
    'playstation_fan'
  ];

  const multiSource = new MultiSourcePSNData();

  for (const gamerTag of testGamerTags) {
    console.log(`\n🔍 Testing gamer tag: ${gamerTag}`);
    console.log('─'.repeat(50));

    try {
      const result = await multiSource.getPlayStationData(gamerTag);
      
      console.log('✅ SUCCESS!');
      console.log(`📊 Data Source: ${result.source}`);
      console.log(`🏆 Data Quality: ${result.dataQuality}`);
      console.log(`⏰ Freshness: ${result.dataFreshness}`);
      console.log(`👤 Profile: ${result.profile.displayName} (Level ${result.profile.level})`);
      console.log(`🎮 Games: ${result.totalGames} games, ${result.totalHours} total hours`);
      console.log(`🏆 Trophies: ${result.profile.totalTrophies} total (${result.profile.platinum}🥇 ${result.profile.gold}🥈 ${result.profile.silver}🥉 ${result.profile.bronze})`);
      
      if (result.games.length > 0) {
        console.log('\n📋 Top Games:');
        result.games.slice(0, 3).forEach((game, i) => {
          console.log(`  ${i + 1}. ${game.name} - ${game.hoursPlayed}h (${game.completionPercentage}%)`);
        });
      }

      if (result.trophies && result.trophies.length > 0) {
        console.log('\n🏆 Recent Trophies:');
        result.trophies.slice(0, 3).forEach((trophy, i) => {
          console.log(`  ${i + 1}. ${trophy.name} (${trophy.type}) - ${trophy.game}`);
        });
      }

      console.log(`\n📈 Statistics:`);
      console.log(`  • Total Hours: ${result.totalHours}`);
      console.log(`  • Total Games: ${result.totalGames}`);
      console.log(`  • Avg Hours/Game: ${result.avgHoursPerGame}`);
      console.log(`  • Data Timestamp: ${result.timestamp}`);

    } catch (error) {
      console.log('❌ FAILED');
      console.log(`💀 Error: ${error.message}`);
      
      if (error.message.includes('All PlayStation data sources failed')) {
        console.log('🔍 All sources attempted:');
        console.log('  • Official PSN API (requires NPSSO token)');
        console.log('  • PSNProfiles scraping (requires public profile)');
        console.log('  • Combined fallback approach');
      }
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Cleanup
  await multiSource.cleanup();
  console.log('\n🧹 Cleanup completed');
  console.log('\n🎉 Multi-source test completed!');
}

// Test individual components
async function testIndividualSources() {
  console.log('\n🔧 Individual Source Tests');
  console.log('==========================\n');

  // Test PSNProfiles scraper
  try {
    console.log('🕷️ Testing PSNProfiles scraper...');
    const { PSNProfilesScraper } = await import('./dist/server/psn/psnProfilesScraper.js');
    const scraper = new PSNProfilesScraper();
    
    const testResult = await scraper.isUserProfilePublic('lazaruz_729');
    console.log(`📍 Profile accessibility test: ${testResult ? 'PUBLIC' : 'PRIVATE/BLOCKED'}`);
    
    if (testResult) {
      console.log('🎯 Attempting full scrape...');
      const scrapedData = await scraper.scrapeUserProfile('lazaruz_729');
      console.log(`✅ Scraping successful: ${scrapedData.profile.totalTrophies} trophies, ${scrapedData.games.length} games`);
    }
    
    await scraper.closeBrowser();
  } catch (error) {
    console.log(`❌ PSNProfiles test failed: ${error.message}`);
  }

  // Test Real PSN API
  try {
    console.log('\n⚡ Testing Real PSN API...');
    const { RealPSNAPI } = await import('./dist/server/psn/realPSNAPI.js');
    const api = new RealPSNAPI();
    
    const npsso = process.env.PSN_NPSSO_TOKEN;
    if (!npsso) {
      console.log('⚠️ No NPSSO token found - skipping official API test');
    } else {
      console.log('🔐 NPSSO token found, testing authentication...');
      await api.authenticate(npsso);
      console.log('✅ Authentication successful');
      
      const profile = await api.getUserProfile();
      console.log(`👤 Profile: ${profile.displayName} (Level ${profile.trophyLevel})`);
    }
  } catch (error) {
    console.log(`❌ Real PSN API test failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive PlayStation data test...\n');
  
  try {
    await testMultiSourcePSN();
    await testIndividualSources();
    
    console.log('\n🎊 All tests completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Visit /psn-multi-test to test the web interface');
    console.log('  2. Use /api/platform/psn-multi-source endpoint for real data');
    console.log('  3. Check token status at /api/psn/status');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.length > 2) {
  const testGamerTag = process.argv[2];
  console.log(`🎯 Testing specific gamer tag: ${testGamerTag}\n`);
  
  async function testSpecific() {
    const multiSource = new MultiSourcePSNData();
    try {
      const result = await multiSource.getPlayStationData(testGamerTag);
      console.log('✅ SUCCESS!');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ FAILED:', error.message);
    } finally {
      await multiSource.cleanup();
    }
  }
  
  testSpecific();
} else {
  main();
}