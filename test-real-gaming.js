/**
 * Test Real Gaming Data Sources
 * Tests the proven methods for getting real Xbox and PlayStation data
 */

async function testRealGamingData() {
  console.log('🎮 Testing Real Gaming Data Sources');
  console.log('===================================\n');

  // Test gamer tags (use real public profiles)
  const testProfiles = [
    { platform: 'xbox', gamerTag: 'MajorNelson' }, // Microsoft's Major Nelson (public profile)
    { platform: 'xbox', gamerTag: 'TheGameAwards' }, // The Game Awards (public profile)
    { platform: 'playstation', gamerTag: 'lazaruz_729' },
    { platform: 'playstation', gamerTag: 'PlayStation' } // Sony's official account
  ];

  for (const profile of testProfiles) {
    console.log(`\n🔍 Testing ${profile.platform} profile: ${profile.gamerTag}`);
    console.log('─'.repeat(50));

    try {
      const endpoint = profile.platform === 'xbox' ? 
        '/api/xbox/real-data' : 
        '/api/playstation/real-data';

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gamerTag: profile.gamerTag })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ SUCCESS!');
        console.log(`📊 Data Source: ${data.dataSource}`);
        console.log(`👤 Profile: ${data.data.displayName} (@${data.data.gamerTag})`);
        console.log(`🎮 Games: ${data.data.totalGames} games, ${data.data.totalHours} total hours`);
        
        if (profile.platform === 'xbox' && data.data.achievements) {
          console.log(`🏆 Achievements: ${data.data.achievements.total} total, ${data.data.gamerscore} gamerscore`);
        }
        
        if (profile.platform === 'playstation' && data.data.trophies) {
          console.log(`🏆 Trophies: ${data.data.trophies.total} total (${data.data.trophies.platinum}🥇 ${data.data.trophies.gold}🥈 ${data.data.trophies.silver}🥉 ${data.data.trophies.bronze})`);
        }

        if (data.data.games.length > 0) {
          console.log('\n📋 Top Games:');
          data.data.games.slice(0, 3).forEach((game, i) => {
            console.log(`  ${i + 1}. ${game.name} - ${game.hoursPlayed}h (${game.completionPercentage}% complete)`);
          });
        }

        console.log(`\n📈 Data Quality:`);
        console.log(`  • Real Data: ${data.realData ? 'YES' : 'NO'}`);
        console.log(`  • Source: ${data.dataSource}`);
        console.log(`  • Last Updated: ${new Date(data.data.lastUpdated).toLocaleString()}`);

      } else {
        console.log('❌ FAILED');
        console.log(`💀 Error: ${data.error}`);
        
        if (data.suggestions) {
          console.log('💡 Suggestions:');
          data.suggestions.forEach(suggestion => {
            console.log(`  • ${suggestion}`);
          });
        }
      }

    } catch (error) {
      console.log('❌ NETWORK ERROR');
      console.log(`💀 Error: ${error.message}`);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n🎉 Real gaming data test completed!');
}

// Test data sources availability
async function testDataSources() {
  console.log('\n🔧 Testing Data Sources Availability');
  console.log('====================================\n');

  try {
    const response = await fetch('http://localhost:5000/api/gaming/test-sources');
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Data sources checked successfully');
      console.log(`📊 Status: ${data.sources.status}`);
      
      console.log('\n🎮 Xbox Sources:');
      Object.entries(data.sources.xbox).forEach(([source, status]) => {
        console.log(`  • ${source}: ${status}`);
      });
      
      console.log('\n🎮 PlayStation Sources:');
      Object.entries(data.sources.playstation).forEach(([source, status]) => {
        console.log(`  • ${source}: ${status}`);
      });
      
      console.log('\n💡 Instructions:');
      console.log(`  • Xbox: ${data.sources.instructions.xbox}`);
      console.log(`  • PlayStation: ${data.sources.instructions.playstation}`);
      
    } else {
      console.log('❌ Failed to check data sources');
    }
    
  } catch (error) {
    console.log('💥 Error checking data sources:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting real gaming data test...\n');
  
  try {
    await testDataSources();
    await testRealGamingData();
    
    console.log('\n🎊 All tests completed!');
    console.log('\n💡 Next steps:');
    console.log('  1. Visit http://localhost:5000/real-gaming-test for web interface');
    console.log('  2. Test with public gamer tags for best results');
    console.log('  3. Set OPENXBL_API_KEY environment variable for official Xbox API access');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.length > 3) {
  const platform = process.argv[2]; // 'xbox' or 'playstation'
  const gamerTag = process.argv[3];
  
  console.log(`🎯 Testing specific ${platform} profile: ${gamerTag}\n`);
  
  async function testSpecific() {
    const endpoint = platform === 'xbox' ? 
      '/api/xbox/real-data' : 
      '/api/playstation/real-data';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamerTag })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ SUCCESS!');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log('❌ FAILED:', data.error);
      }
    } catch (error) {
      console.log('💥 ERROR:', error.message);
    }
  }
  
  testSpecific();
} else {
  main();
}