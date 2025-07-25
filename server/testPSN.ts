import { runPSNDemo } from './psn/demo';

// This is your test file - you'll paste your NPSSO token here when ready
const NPSSO_TOKEN = process.env.PSN_NPSSO_TOKEN || '';

async function main() {
  if (!NPSSO_TOKEN) {
    console.log('❌ No NPSSO token provided!');
    console.log('\n📋 To get your NPSSO token:');
    console.log('1. Login to https://my.playstation.com');
    console.log('2. Open browser dev tools (F12)');
    console.log('3. Go to Application > Cookies > my.playstation.com');
    console.log('4. Find the "npsso" cookie and copy its value');
    console.log('5. Set PSN_NPSSO_TOKEN environment variable or paste it in this file\n');
    
    console.log('Or run: node -e "require(\'./dist/server/testPSN.js\').testWithToken(\'YOUR_NPSSO_HERE\')"');
    return;
  }

  console.log('🚀 Starting PlayStation data collection...\n');
  await runPSNDemo(NPSSO_TOKEN, true); // true = try API first, then scraping if needed
}

// Function to test with a provided token
export async function testWithToken(npsso: string) {
  console.log('🚀 Testing with provided NPSSO token...\n');
  await runPSNDemo(npsso, true);
}

// Function to test scraping only (no API)
export async function testScrapingOnly(npsso: string) {
  console.log('🕷️  Testing web scraping only...\n');
  await runPSNDemo(npsso, false);
}

if (require.main === module) {
  main().catch(console.error);
}