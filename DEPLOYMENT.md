# Deployment Guide

## Pre-Deployment Checklist

### ✅ Production Ready Components
- [x] Xbox integration with authentic achievement data
- [x] Multi-platform API endpoint (`/api/platform/lookup`)
- [x] Comprehensive error handling and caching
- [x] Performance monitoring and optimization
- [x] TypeScript type safety throughout
- [x] Database schema and migrations

### ⚠️ Optional Components (Platform Dependent)
- [ ] PlayStation integration (requires NPSSO token refresh)
- [ ] Steam integration (requires public Steam profiles)

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Steam API
STEAM_API_KEY=your_steam_web_api_key

# Xbox API (Production Ready)
OPENXBL_API_KEY=your_openxbl_premium_api_key

# PlayStation API (Optional - requires token management)
PSN_NPSSO_TOKEN=your_playstation_npsso_token

# Additional APIs (Optional)
XAPI_TOKEN=your_xapi_token
```

## Deployment Platforms

### Replit Deployments (Recommended)
1. Click "Deploy" button in Replit
2. Configure environment variables in deployment settings
3. System automatically handles build and hosting

### Manual Deployment

#### Build Process
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Database setup
npm run db:push
```

#### Production Start
```bash
npm start
```

## Database Setup

The application uses PostgreSQL with Drizzle ORM:

```bash
# Apply database schema
npm run db:push

# For development
npm run db:studio
```

## Performance Optimization

### Caching Configuration
- In-memory cache with 5-minute TTL
- Automatic cleanup every 2 minutes
- Cache statistics available at `/api/cache/stats`

### Rate Limiting
- Intelligent API request management
- Fallback systems for API failures
- Error state management

## Monitoring and Health Checks

### Health Check Endpoints
- `GET /api/cache/stats` - Cache performance
- `GET /api/psn/status` - PlayStation token status
- `POST /api/platform/lookup` - Primary integration test

### Performance Metrics
- Response times tracked per platform
- Cache hit/miss ratios
- Error rates and types

## Security Considerations

### API Keys
- Store all API keys in environment variables
- Never commit secrets to version control
- Use separate keys for development/production

### Token Management
- PlayStation tokens expire every 24-48 hours
- Automatic expiry detection implemented
- User guidance for token refresh process

## Troubleshooting

### Common Issues

**Xbox Integration:**
- Verify OPENXBL_API_KEY is premium subscription
- Check API key format and permissions
- Monitor rate limits (premium allows higher limits)

**PlayStation Integration:**
- NPSSO token expires frequently (24-48 hours)
- Use incognito mode for token refresh
- Verify cookie extraction process

**Steam Integration:**
- Requires public Steam profiles
- Check Steam API key validity
- Verify profile privacy settings

### Debug Mode
Set `NODE_ENV=development` for detailed logging:
- API request/response logging
- Cache operation details
- Error stack traces
- Performance timing

## Production Recommendations

### Primary Integration
Start with Xbox integration for production:
- No token expiry issues
- Authentic achievement data
- Stable API performance
- Premium subscription benefits

### Secondary Platforms
Add PlayStation and Steam as optional features:
- Implement token refresh workflows
- Provide clear user guidance
- Graceful degradation when unavailable

## API Documentation

### Primary Endpoint
```
POST /api/platform/lookup
Content-Type: application/json

{
  "gamerTag": "username",
  "platform": "xbox|playstation|steam"
}
```

### Response Format
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
  "qualificationReason": "Premium Xbox data",
  "topGames": [...]
}
```

## GitHub Dashboard Integration

The system is ready for GitHub dashboard integration:

### Integration Steps
1. Deploy the application
2. Configure environment variables
3. Use `/api/platform/lookup` endpoint
4. Handle authentication as needed
5. Display authentic gaming statistics

### Data Integrity
- Only authentic data from official platform APIs
- No fake or estimated statistics
- Clear error states for unavailable data
- Comprehensive documentation for each platform

## Support and Maintenance

### Regular Maintenance
- Monitor PlayStation token expiry
- Update API keys as needed
- Review cache performance metrics
- Monitor error rates and response times

### Scaling Considerations
- Database connection pooling
- API rate limit monitoring  
- Cache optimization for high traffic
- Load balancing for multiple instances

---

The application is production-ready with Xbox integration providing authentic gaming data. Additional platforms can be enabled based on token management requirements and user needs.