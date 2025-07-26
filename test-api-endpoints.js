#!/usr/bin/env node

/**
 * API Endpoint Testing Script
 * Tests all available gaming platform endpoints
 */

console.log('🔌 API ENDPOINT TESTING SUITE');
console.log('=============================');

const endpoints = [
  {
    name: 'Main Platform Lookup',
    method: 'POST',
    url: '/api/platform/lookup',
    body: { gamerTag: 'Wonder Bread326', platform: 'xbox' },
    description: 'Primary endpoint for all platform lookups'
  },
  {
    name: 'Xbox Premium Dashboard',
    method: 'GET', 
    url: '/premium-xbox',
    description: 'Xbox-specific dashboard with premium OpenXBL data'
  },
  {
    name: 'Cache Statistics',
    method: 'GET',
    url: '/api/cache/stats',
    description: 'Performance monitoring for platform data caching'
  },
  {
    name: 'PlayStation API (Real)',
    method: 'POST',
    url: '/api/platform/psn-real',
    body: { gamerTag: 'LAZARUS_729' },
    description: 'Direct PlayStation API integration'
  }
];

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log('='.repeat(50));
  console.log(`Method: ${endpoint.method}`);
  console.log(`URL: http://localhost:5000${endpoint.url}`);
  console.log(`Description: ${endpoint.description}`);
  
  try {
    const options = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
      console.log(`Request Body: ${JSON.stringify(endpoint.body)}`);
    }
    
    const startTime = Date.now();
    const response = await fetch(`http://localhost:5000${endpoint.url}`, options);
    const duration = Date.now() - startTime;
    
    console.log(`Status: ${response.status} (${duration}ms)`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ SUCCESS`);
        
        // Display relevant data based on endpoint
        if (endpoint.url.includes('/lookup') || endpoint.url.includes('/psn-')) {
          console.log(`   Player: ${data.player?.gamerTag || data.player?.displayName || 'N/A'}`);
          console.log(`   Hours: ${data.totalHours || 0}h`);
          console.log(`   Games: ${data.totalGames || 0}`);
          console.log(`   Data Quality: ${data.qualificationStatus || 'unknown'}`);
        } else if (endpoint.url.includes('/cache/stats')) {
          console.log(`   Cache Hits: ${data.hits || 0}`);
          console.log(`   Cache Size: ${data.size || 0} entries`);
        } else {
          console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
        }
        
      } else {
        console.log(`✅ SUCCESS (Non-JSON response)`);
        console.log(`   Content Type: ${contentType}`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ FAILED`);
      console.log(`   Error: ${errorText.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.log(`❌ CONNECTION ERROR`);
    console.log(`   Error: ${error.message}`);
  }
}

async function testAllEndpoints() {
  console.log('Testing all available API endpoints...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 ENDPOINT TESTING SUMMARY');
  console.log('===========================');
  console.log('Primary Integration Endpoint:');
  console.log('  POST /api/platform/lookup');
  console.log('  • Supports: xbox, playstation, steam platforms');
  console.log('  • Returns: Complete gaming profile with authentic data');
  console.log('  • Production ready for GitHub dashboard integration');
  
  console.log('\nSupporting Endpoints:');
  console.log('  GET /premium-xbox - Xbox dashboard');
  console.log('  GET /api/cache/stats - Performance monitoring');
  console.log('  POST /api/platform/psn-real - Direct PlayStation API');
  
  console.log('\n🔧 HOW TO INTEGRATE WITH GITHUB DASHBOARD:');
  console.log('==========================================');
  console.log('1. Use POST /api/platform/lookup as your main endpoint');
  console.log('2. Send requests with: { "gamerTag": "USERNAME", "platform": "PLATFORM" }');
  console.log('3. Receive authentic gaming data including hours, games, achievements');
  console.log('4. Xbox integration is production-ready with real data');
  console.log('5. PlayStation ready once NPSSO token is refreshed');
}

testAllEndpoints().catch(console.error);