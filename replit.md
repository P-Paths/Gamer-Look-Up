# Steam Profile Lookup Application

## Overview

This is a full-stack web application that allows users to look up Steam gaming profiles by gamer tag or Steam ID. The application provides detailed statistics about players including their games, playtime, and profile information. Built with a modern React frontend and Express.js backend, it integrates with the Steam Web API to fetch real-time gaming data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom Steam-themed color palette
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: PostgreSQL (via Neon serverless)
- **API Integration**: Axios for Steam Web API calls
- **Caching**: In-memory storage for Steam API response caching
- **Session Management**: PostgreSQL session store with connect-pg-simple

### Design Patterns
- **Monorepo Structure**: Client and server code organized in separate directories with shared schemas
- **Type Safety**: End-to-end TypeScript with shared type definitions
- **API-First Design**: RESTful API endpoints with standardized request/response patterns

## Key Components

### Frontend Components
1. **Home Page** (`client/src/pages/home.tsx`)
   - Steam profile lookup form with validation
   - Results display with player statistics and top games
   - Collapsible instructions section
   - URL parameter support for pre-filling gamer tags

2. **UI Component Library** (`client/src/components/ui/`)
   - Complete shadcn/ui component collection
   - Custom styling with Steam-themed colors
   - Responsive design with mobile-first approach

3. **API Client** (`client/src/lib/queryClient.ts`)
   - Centralized HTTP client with error handling
   - React Query configuration for caching and background updates

### Backend Components
1. **Steam API Integration** (`server/routes.ts`)
   - Steam profile resolution (vanity URL to Steam ID)
   - Player summary retrieval
   - Games library fetching with playtime statistics
   - Comprehensive error handling for API failures

2. **Caching Layer** (`server/storage.ts`)
   - In-memory cache for Steam API responses
   - 5-minute TTL to balance performance and data freshness
   - Interface-based design for easy storage backend swapping

3. **Development Tools** (`server/vite.ts`)
   - Vite integration for hot module replacement
   - Static file serving for production builds
   - Development logging and error handling

## Data Flow

1. **User Input**: User enters Steam gamer tag in the frontend form
2. **Form Validation**: Zod schema validates input before submission
3. **API Request**: Frontend sends POST request to `/api/steam/lookup`
4. **Steam ID Resolution**: Backend resolves gamer tag to Steam ID via Steam API
5. **Data Fetching**: Parallel requests to Steam API for player info and games
6. **Data Processing**: Backend calculates statistics (total hours, averages, top games)
7. **Caching**: Results stored in memory cache for subsequent requests
8. **Response**: Processed data returned to frontend
9. **UI Update**: React Query updates component state and renders results

## External Dependencies

### Steam Web API
- **Purpose**: Fetch player profiles and game libraries
- **Authentication**: Requires STEAM_API_KEY environment variable
- **Endpoints Used**:
  - `ResolveVanityURL` - Convert custom URLs to Steam IDs
  - `GetPlayerSummaries` - Get player profile information
  - `GetOwnedGames` - Retrieve player's game library with playtime
- **Rate Limiting**: Handled through caching layer

### Database
- **Provider**: Neon PostgreSQL (serverless)
- **Configuration**: Drizzle ORM with connection via DATABASE_URL
- **Usage**: Session storage and potential future user data
- **Schema**: Defined in `shared/schema.ts` with Steam-specific types

### UI Framework Dependencies
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent iconography
- **React Icons**: Additional icons including Steam branding

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR on port 5173
- **Backend**: tsx runner for TypeScript execution
- **Database**: Drizzle kit for schema management and migrations
- **Environment**: NODE_ENV=development with comprehensive logging

### Production Build
- **Frontend**: Vite build to `dist/public` directory
- **Backend**: esbuild compilation to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `STEAM_API_KEY` or `STEAM_WEB_API_KEY`: Steam Web API authentication
- `NODE_ENV`: Environment specification (development/production)

### Replit Optimizations
- **Cartographer Plugin**: Development-only navigation assistance
- **Runtime Error Modal**: Enhanced error display in development
- **Dev Banner**: Replit branding for external access