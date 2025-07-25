// Quick test script for PlayStation NPSSO integration
// Usage: node test-psn.js "YOUR_NPSSO_TOKEN_HERE"

const token = process.argv[2];

if (!token) {
  console.log('❌ Please provide your NPSSO token:');
  console.log('   node test-psn.js "YOUR_64_CHAR_NPSSO_TOKEN"');
  console.log('');
  console.log('📋 To get your NPSSO token:');
  console.log('1. Login to https://my.playstation.com');
  console.log('2. Open browser dev tools (F12)');
  console.log('3. Go to Application > Cookies > my.playstation.com');
  console.log('4. Find the "npsso" cookie and copy its value');
  process.exit(1);
}

async function testPlayStationAPI() {
  try {
    console.log('🎮 Testing PlayStation API with your NPSSO token...\n');
    
    const response = await fetch('http://localhost:5000/api/platform/psn-real', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ npsso: token }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! Real PlayStation data retrieved:');
      console.log(`   Player: ${data.player.displayName}`);
      console.log(`   Total Hours: ${data.totalHours}h`);
      console.log(`   Total Games: ${data.totalGames}`);
      console.log(`   Top Game: ${data.topGames[0]?.name || 'None'}`);
      if (data.trophies) {
        console.log(`   Trophy Level: ${data.trophies.level}`);
        console.log(`   Total Trophies: ${data.trophies.totalTrophies}`);
      }
    } else {
      console.log('❌ FAILED:', data.error);
      
      if (data.error?.includes('Invalid NPSSO')) {
        console.log('\n💡 Try getting a fresh NPSSO token from PlayStation.com');
      }
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

testPlayStationAPI();