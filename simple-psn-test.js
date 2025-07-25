/**
 * Simple PlayStation Data Source Test
 * Tests PlayStation data retrieval using HTTP API calls
 */

async function testPSNMultiSource(gamerTag) {
  console.log(`🎯 Testing PlayStation Multi-Source for: ${gamerTag}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch('http://localhost:5000/api/platform/psn-multi-source', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gamerTag })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! PlayStation data retrieved');
      console.log('📊 Data Summary:');
      console.log(`  • Player: ${data.player.displayName} (@${data.player.gamerTag})`);
      console.log(`  • Total Hours: ${data.totalHours}h`);
      console.log(`  • Total Games: ${data.totalGames}`);
      console.log(`  • Data Source: ${data.dataSource}`);
      console.log(`  • Data Quality: ${data.dataQuality}`);
      console.log(`  • Data Freshness: ${data.dataFreshness}`);
      
      if (data.trophies) {
        console.log('\n🏆 Trophy Information:');
        console.log(`  • Level: ${data.trophies.level}`);
        console.log(`  • Total Trophies: ${data.trophies.totalTrophies}`);
        console.log(`  • Platinum: ${data.trophies.platinum}`);
        console.log(`  • Gold: ${data.trophies.gold}`);
        console.log(`  • Silver: ${data.trophies.silver}`);
        console.log(`  • Bronze: ${data.trophies.bronze}`);
      }

      if (data.topGames && data.topGames.length > 0) {
        console.log('\n🎮 Top Games:');
        data.topGames.forEach((game, i) => {
          console.log(`  ${i + 1}. ${game.name} - ${game.hoursPlayed}h`);
        });
      }

      console.log('\n📈 Statistics:');
      console.log(`  • Avg Hours/Game: ${data.avgHoursPerGame}h`);
      console.log(`  • Qualification: ${data.qualificationStatus}`);
      console.log(`  • Real Data: ${data.realData ? 'YES' : 'NO'}`);
      
      return { success: true, data };
    } else {
      console.log('❌ FAILED to retrieve PlayStation data');
      console.log(`💀 Error: ${data.error || 'Unknown error'}`);
      
      if (data.sources_attempted) {
        console.log('🔍 Sources attempted:');
        data.sources_attempted.forEach(source => {
          console.log(`  • ${source.replace('_', ' ').toUpperCase()}`);
        });
      }
      
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log('💥 Network or system error:');
    console.log(`💀 ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testMultipleGamerTags() {
  const testTags = ['lazaruz_729', 'test_user', 'sony_gamer'];
  
  console.log('🚀 Testing Multiple PlayStation Profiles');
  console.log('==========================================\n');

  for (const tag of testTags) {
    const result = await testPSNMultiSource(tag);
    console.log(); // Empty line between tests
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function testTokenStatus() {
  console.log('🔐 Testing PSN Token Status');
  console.log('============================');

  try {
    const response = await fetch('http://localhost:5000/api/psn/status');
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Token status retrieved');
      console.log(`📊 Token exists: ${data.tokenStatus.exists}`);
      console.log(`⏰ Is expired: ${data.tokenStatus.isExpired}`);
      if (data.tokenStatus.lastUpdated) {
        console.log(`🕒 Last updated: ${data.tokenStatus.lastUpdated}`);
      }
    } else {
      console.log('❌ Token status check failed');
      console.log(`💀 Error: ${data.error}`);
    }
  } catch (error) {
    console.log('💥 Token status error:', error.message);
  }
}

// Main execution
async function main() {
  const gamerTag = process.argv[2];
  
  if (gamerTag) {
    console.log(`🎯 Testing specific gamer tag: ${gamerTag}\n`);
    await testPSNMultiSource(gamerTag);
  } else {
    await testTokenStatus();
    console.log(); // Empty line
    await testMultipleGamerTags();
  }

  console.log('\n🎉 PlayStation multi-source test completed!');
  console.log('\n💡 Next steps:');
  console.log('  • Visit http://localhost:5000/psn-multi-test for web interface');
  console.log('  • Test with your own gamer tag: node simple-psn-test.js YOUR_TAG');
  console.log('  • Check internal tools at /internal for staff features');
}

main().catch(console.error);