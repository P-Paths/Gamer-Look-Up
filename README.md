# Multi-Platform Gaming Statistics API

A production-ready SaaS application that retrieves authentic gaming statistics from Steam, PlayStation Network, and Xbox Live. Built for integration with GitHub dashboards and personal gaming analytics.

## 🎮 Features

- **Multi-Platform Support**: Xbox, PlayStation, and Steam integration
- **Authentic Data Only**: No fake or estimated statistics - only real gaming data
- **Premium Xbox Integration**: OpenXBL premium subscription for authentic achievement data
- **PlayStation API**: Complete PSN integration with trophy tracking
- **Steam Web API**: Full Steam profile and game library access
- **Production Ready**: Optimized caching, error handling, and performance monitoring

## 🚀 Live Demo

Visit the test dashboard: `/test`

## 📊 Current Status

**Xbox Integration: ✅ Production Ready**
- Real achievement data from OpenXBL premium API
- Authentic 0 hours displayed (Xbox platform limitation)
- 10+ real games from user library
- Gamerscore and achievement tracking

**PlayStation Integration: ✅ Built and Ready**
- Complete PSN API service implemented
- Profile: LAZARUS_729 (Wonder Cheese Bread)
- Requires NPSSO token refresh every 24-48 hours

**Steam Integration: ✅ Complete**
- Steam Web API fully functional
- Requires public Steam profiles for data access

## 🔧 API Usage

### Primary Endpoint

```bash
POST /api/platform/lookup
```

**Request:**
```json
{
  "gamerTag": "Wonder Bread326",
  "platform": "xbox"
}
```

**Response:**
```json
{
  "platform": "xbox",
  "player": {
    "gamerTag": "Wonder Bread326",
    "gamerscore": 12345
  },
  "totalHours": 0,
  "totalGames": 10,
  "qualificationStatus": "not_qualified",
  "qualificationReason": "Premium Xbox data: authentic achievement data",
  "topGames": [
    {
      "name": "Call of Duty®",
      "hoursPlayed": 0,
      "platform": "xbox"
    }
  ]
}
```

## 🏗️ Architecture

**Frontend**: React 18 + TypeScript + Tailwind CSS
**Backend**: Express.js + TypeScript + PostgreSQL
**APIs**: Steam Web API, OpenXBL Premium, PlayStation PSN API
**Caching**: In-memory storage with 5-minute TTL
**Database**: PostgreSQL via Neon serverless

## 🔑 Required Environment Variables

```env
DATABASE_URL=postgresql://...
STEAM_API_KEY=your_steam_api_key
OPENXBL_API_KEY=your_openxbl_premium_key
PSN_NPSSO_TOKEN=your_playstation_npsso_token
XAPI_TOKEN=your_xapi_token (optional)
```

## 📋 Installation

```bash
# Install dependencies
npm install

# Set up database
npm run db:push

# Start development server
npm run dev
```

## 🧪 Testing

**Visual Testing:**
Visit `/test` for interactive platform testing

**API Testing:**
```bash
# Test Xbox integration
curl -X POST http://localhost:5000/api/platform/lookup \
  -H "Content-Type: application/json" \
  -d '{"platform":"xbox","gamerTag":"Wonder Bread326"}'

# Run automated tests
node test-live-integration.js
node test-api-endpoints.js
```

## 📈 Performance

- **Caching**: 5-minute TTL with automatic cleanup
- **Error Handling**: Comprehensive error states and user guidance
- **Rate Limiting**: Intelligent API request management
- **Monitoring**: Cache statistics and performance metrics

## 🔐 Security

- **Token Management**: Automatic expiry detection for PlayStation tokens
- **Data Integrity**: Only authentic gaming data, no estimates or fake data
- **API Security**: Secure token handling and validation
- **Rate Limiting**: Protection against API abuse

## 🎯 Data Integrity Promise

This system maintains strict data integrity:
- Xbox shows authentic 0 hours (platform limitation, not estimation)
- PlayStation provides real trophy and game data
- Steam displays actual playtime from public profiles
- No fake, estimated, or placeholder data anywhere

## 📱 GitHub Dashboard Integration

Ready for integration with personal GitHub dashboards:
- Standard REST API endpoints
- JSON response format
- Comprehensive error handling
- Real-time gaming statistics

## 🔄 Token Management

**PlayStation NPSSO Tokens:**
- Expire every 24-48 hours (Sony security feature)
- 5-minute refresh process via PlayStation.com
- Automatic expiry detection and user guidance
- Complete refresh guide included

## 🛠️ Development

Built with modern development practices:
- TypeScript for type safety
- Drizzle ORM for database management
- React Query for state management
- shadcn/ui for consistent UI components
- Comprehensive error handling and logging

## 📊 Supported Platforms

| Platform | Status | Data Type | Limitations |
|----------|--------|-----------|-------------|
| Xbox | ✅ Production | Authentic achievements | No playtime hours |
| PlayStation | ✅ Ready | Real trophies & games | Token refresh needed |
| Steam | ✅ Complete | Full game library | Requires public profile |

## 🚀 Deployment

Ready for deployment on any Node.js hosting platform:
- Replit Deployments (recommended)
- Vercel, Netlify, Heroku
- Docker containers
- Traditional VPS

## 📞 Support

For questions about API integration or gaming platform authentication, refer to the comprehensive documentation in the project files.

---

**Note**: This system provides only authentic gaming data from official platform APIs. No fake or estimated statistics are ever displayed, ensuring complete data integrity for professional gaming analytics.