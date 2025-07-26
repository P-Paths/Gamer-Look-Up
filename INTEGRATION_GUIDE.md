# Gaming Data API Integration Guide

## How to Integrate Into Your Existing GitHub Dashboard

### Option 1: API Endpoints (Recommended)
Copy these working API endpoints to your dashboard:

```javascript
// Steam Data
POST /api/steam/real-data
Body: { "gamerTag": "username" }

// Xbox Data (Authentic Profile + Paid Games Data)
POST /api/xbox/real-data  
Body: { "gamerTag": "Wonder Bread326" }

// PlayStation Data (Your existing PSN system)
POST /api/playstation/real-data
Body: { "gamerTag": "psn_username" }
```

### Option 2: Copy Service Files
Take these core files from this project:

**Steam Service:**
- `server/services/steamService.ts` - Complete Steam API integration
- API Key: Uses your `STEAM_API_KEY`

**Xbox Service:**  
- `server/services/realGamingDataService.ts` - Xbox OpenXBL integration
- API Key: Uses your `OPENXBL_API_KEY`

**PlayStation Service:**
- Your entire `server/psn/` folder is already built and working
- Uses your `PSN_NPSSO_TOKEN`

### Option 3: Direct Component Copy
Copy the React component:
- `client/src/pages/simple-gaming-lookup.tsx` - Clean search interface
- Includes all three platforms with authentic data display

## API Response Format

All endpoints return this standardized format:

```json
{
  "success": true,
  "platform": "steam|xbox|playstation",
  "data": {
    "gamerTag": "username",
    "displayName": "Display Name",
    "totalGames": 20,
    "totalHours": 1500,
    "games": [
      {
        "name": "Game Name",
        "hoursPlayed": 45,
        "lastPlayed": "2025-07-24T02:56:55.100Z"
      }
    ],
    "dataSource": "steam_api_real|openxbl_api_real|psn_api_real"
  }
}
```

## Environment Variables Needed

```bash
STEAM_API_KEY=your_steam_key
OPENXBL_API_KEY=your_openxbl_key  
PSN_NPSSO_TOKEN=your_psn_token
```

## Upgrading Xbox for Full Games Data

**Current Status**: Free tier (profile only)
**Upgrade Cost**: ~$10-30/month for OpenXBL paid plan
**What You Get**: Full games list, playtime hours, achievements

**To Upgrade:**
1. Visit xbl.io
2. Sign up for paid subscription  
3. No code changes needed - API will automatically return games data

## Integration Steps for Your Dashboard

1. **Copy API endpoints** to your dashboard backend
2. **Copy service files** for the platforms you want
3. **Set environment variables** with your API keys
4. **Update your frontend** to call these endpoints
5. **Test with real gamer tags** to verify authentic data

## Testing

Test with these known working accounts:
- Steam: "gaben" or "MrFXC"
- Xbox: "Wonder Bread326" (your account)
- PlayStation: Any PSN username with your NPSSO token

All data returned is 100% authentic from official APIs - no mock or fake data.