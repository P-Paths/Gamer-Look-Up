import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { steamLookupRequestSchema, type SteamLookupResponse } from "@shared/schema";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  const STEAM_API_KEY = process.env.STEAM_API_KEY || process.env.STEAM_WEB_API_KEY || "";
  
  if (!STEAM_API_KEY) {
    console.warn("Warning: STEAM_API_KEY not found in environment variables");
  }

  // Steam lookup endpoint
  app.post("/api/steam/lookup", async (req, res) => {
    try {
      const { gamerTag } = steamLookupRequestSchema.parse(req.body);
      
      if (!STEAM_API_KEY) {
        return res.status(500).json({ 
          error: "Steam API key not configured. Please add STEAM_API_KEY to environment variables." 
        });
      }

      // Step 1: Resolve gamer tag to SteamID64
      let steamId = gamerTag;
      
      // Check if it's already a SteamID64 (17 digits starting with 765)
      if (!/^765\d{14}$/.test(gamerTag)) {
        try {
          const vanityResponse = await axios.get(
            `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/`,
            {
              params: {
                key: STEAM_API_KEY,
                vanityurl: gamerTag,
              },
            }
          );

          if (vanityResponse.data.response.success !== 1) {
            return res.status(404).json({ 
              error: "Steam profile not found. Please check the gamer tag and try again." 
            });
          }

          steamId = vanityResponse.data.response.steamid;
        } catch (error) {
          return res.status(404).json({ 
            error: "Unable to resolve gamer tag. Please check the input and try again." 
          });
        }
      }

      // Check cache first
      const cached = await storage.getCachedLookup(steamId);
      if (cached) {
        return res.json(cached);
      }

      // Step 2: Get player summary
      const playerResponse = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`,
        {
          params: {
            key: STEAM_API_KEY,
            steamids: steamId,
          },
        }
      );

      const players = playerResponse.data.response.players;
      if (!players || players.length === 0) {
        return res.status(404).json({ 
          error: "Steam profile not found or may be private." 
        });
      }

      const player = players[0];

      // Step 3: Get owned games
      const gamesResponse = await axios.get(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
        {
          params: {
            key: STEAM_API_KEY,
            steamid: steamId,
            format: "json",
            include_appinfo: 1,
            include_played_free_games: 1,
          },
        }
      );

      if (!gamesResponse.data.response.games) {
        return res.status(403).json({ 
          error: "This Steam profile's game details are private. The user needs to make their game details public in their Steam privacy settings." 
        });
      }

      const games = gamesResponse.data.response.games || [];
      
      // Calculate statistics
      const totalMinutes = games.reduce((sum: number, game: any) => sum + game.playtime_forever, 0);
      const totalHours = Math.round(totalMinutes / 60);
      const totalGames = games.length;
      const avgHoursPerGame = totalGames > 0 ? Math.round((totalHours / totalGames) * 10) / 10 : 0;

      // Get top 3 most played games
      const topGames = games
        .sort((a: any, b: any) => b.playtime_forever - a.playtime_forever)
        .slice(0, 3)
        .map((game: any) => ({
          appid: game.appid,
          name: game.name,
          playtime_forever: Math.round(game.playtime_forever / 60), // Convert to hours
          playtime_2weeks: game.playtime_2weeks ? Math.round(game.playtime_2weeks / 60) : 0,
          img_icon_url: game.img_icon_url,
          img_logo_url: game.img_logo_url,
        }));

      // Format last logoff time
      let lastLogoffFormatted = "Unknown";
      if (player.lastlogoff) {
        const lastLogoff = new Date(player.lastlogoff * 1000);
        const now = new Date();
        const diffMs = now.getTime() - lastLogoff.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) {
          lastLogoffFormatted = "Less than an hour ago";
        } else if (diffHours < 24) {
          lastLogoffFormatted = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
          lastLogoffFormatted = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
          lastLogoffFormatted = lastLogoff.toLocaleDateString();
        }
      }

      const response: SteamLookupResponse = {
        player,
        totalHours,
        totalGames,
        avgHoursPerGame,
        topGames,
        lastLogoffFormatted,
      };

      // Cache the response
      await storage.setCachedLookup(steamId, response);

      res.json(response);
    } catch (error: any) {
      console.error("Steam API error:", error);
      
      if (error.response?.status === 403) {
        return res.status(403).json({ 
          error: "Steam API access forbidden. Please check your API key." 
        });
      }
      
      if (error.response?.status === 401) {
        return res.status(401).json({ 
          error: "Invalid Steam API key. Please check your configuration." 
        });
      }

      res.status(500).json({ 
        error: "An error occurred while fetching Steam data. Please try again later." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
