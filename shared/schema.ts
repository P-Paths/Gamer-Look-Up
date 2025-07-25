import { z } from "zod";

// Steam API response schemas
export const steamPlayerSchema = z.object({
  steamid: z.string(),
  personaname: z.string(),
  profileurl: z.string(),
  avatar: z.string(),
  avatarmedium: z.string(),
  avatarfull: z.string(),
  personastate: z.number(),
  lastlogoff: z.number().optional(),
  timecreated: z.number().optional(),
});

export const steamGameSchema = z.object({
  appid: z.number(),
  name: z.string(),
  playtime_forever: z.number(),
  playtime_2weeks: z.number().optional(),
  img_icon_url: z.string().optional(),
  img_logo_url: z.string().optional(),
});

export const steamLookupRequestSchema = z.object({
  gamerTag: z.string().min(1, "Gamer tag is required"),
});

export const steamLookupResponseSchema = z.object({
  player: steamPlayerSchema,
  totalHours: z.number(),
  totalGames: z.number(),
  avgHoursPerGame: z.number(),
  topGames: z.array(steamGameSchema).max(3),
  lastLogoffFormatted: z.string(),
});

// Types
export type SteamPlayer = z.infer<typeof steamPlayerSchema>;
export type SteamGame = z.infer<typeof steamGameSchema>;
export type SteamLookupRequest = z.infer<typeof steamLookupRequestSchema>;
export type SteamLookupResponse = z.infer<typeof steamLookupResponseSchema>;
