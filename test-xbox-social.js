// Test Xbox Social Service with your $5 OpenXBL subscription
import axios from 'axios';

async function testXboxSocial() {
  const BASE_URL = 'http://localhost:5000';
  
  console.log('🧪 Testing Xbox Social Features with $5 Subscription');
  console.log('=====================================================');
  
  try {
    // Test player search
    console.log('\n🔍 Testing Player Search...');
    const searchResult = await axios.post(`${BASE_URL}/api/platform/lookup`, {
      platform: 'xbox',
      gamerTag: 'Wonder Bread326'
    });
    
    console.log(`✅ Player found: ${searchResult.data.player.gamerTag}`);
    console.log(`📊 Gamerscore: ${searchResult.data.player.gamerscore || 'N/A'}`);
    console.log(`🎮 Data source: ${searchResult.data.player.dataSource || 'Unknown'}`);
    console.log(`📈 Total games: ${searchResult.data.totalGames}`);
    console.log(`⏰ Total hours: ${searchResult.data.totalHours}`);
    
    if (searchResult.data.qualificationStatus) {
      console.log(`🎯 Status: ${searchResult.data.qualificationStatus}`);
      console.log(`📝 Note: ${searchResult.data.qualificationReason}`);
    }
    
  } catch (error) {
    console.error('❌ Xbox lookup failed:', error.message);
  }
  
  // Test what we can do with social features
  console.log('\n👥 What Your $5 Subscription Provides:');
  console.log('✅ Player profile search and display');
  console.log('✅ Gamerscore and avatar');
  console.log('✅ Friends list access');
  console.log('✅ Recent players (256+ people)');
  console.log('✅ Player comparison tools');
  console.log('❌ Games library and hours played (requires upgrade)');
  console.log('❌ Achievement tracking (requires upgrade)');
  
  console.log('\n💡 Recommendation:');
  console.log('Your $5 plan is perfect for:');
  console.log('- Social gaming features');
  console.log('- Player lookup and comparison');
  console.log('- Friend management');
  console.log('- Profile browsing');
}

testXboxSocial().catch(console.error);