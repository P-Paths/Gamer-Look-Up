import { z } from "zod";
import { pgTable, varchar, timestamp, integer, boolean, text, index } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";

// Gaming platforms enum
export const platformSchema = z.enum(["steam", "playstation", "xbox"]);
export type Platform = z.infer<typeof platformSchema>;

// User authentication tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPlatformAccounts = pgTable("user_platform_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  platform: varchar("platform").$type<Platform>().notNull(),
  platformUserId: varchar("platform_user_id").notNull(),
  gamerTag: varchar("gamer_tag").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gamingStats = pgTable("gaming_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userPlatformAccountId: varchar("user_platform_account_id").references(() => userPlatformAccounts.id),
  totalHours: integer("total_hours").default(0),
  totalGames: integer("total_games").default(0),
  avgHoursPerGame: integer("avg_hours_per_game").default(0),
  qualificationStatus: varchar("qualification_status"), // "qualified", "not_qualified", "pending"
  lastCalculated: timestamp("last_calculated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const friendsList = pgTable("friends_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userPlatformAccountId: varchar("user_platform_account_id").references(() => userPlatformAccounts.id),
  friendPlatformUserId: varchar("friend_platform_user_id").notNull(),
  friendGamerTag: varchar("friend_gamer_tag").notNull(),
  platform: varchar("platform").$type<Platform>().notNull(),
  lastPlayed: timestamp("last_played"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_friends_platform_user").on(table.userPlatformAccountId, table.platform),
]);

export const gameActivities = pgTable("game_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userPlatformAccountId: varchar("user_platform_account_id").references(() => userPlatformAccounts.id),
  gameId: varchar("game_id").notNull(),
  gameName: varchar("game_name").notNull(),
  platform: varchar("platform").$type<Platform>().notNull(),
  hoursPlayed: integer("hours_played").default(0),
  lastPlayed: timestamp("last_played"),
  isTopGame: boolean("is_top_game").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_game_activities_platform").on(table.userPlatformAccountId, table.platform),
]);

// Schema types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserPlatformAccount = typeof userPlatformAccounts.$inferSelect;
export type InsertUserPlatformAccount = typeof userPlatformAccounts.$inferInsert;
export type GamingStats = typeof gamingStats.$inferSelect;
export type InsertGamingStats = typeof gamingStats.$inferInsert;
export type FriendsList = typeof friendsList.$inferSelect;
export type InsertFriendsList = typeof friendsList.$inferInsert;
export type GameActivity = typeof gameActivities.$inferSelect;
export type InsertGameActivity = typeof gameActivities.$inferInsert;

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserPlatformAccountSchema = createInsertSchema(userPlatformAccounts).omit({ id: true, createdAt: true, updatedAt: true });

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

// Multi-platform lookup schemas
export const platformLookupRequestSchema = z.object({
  gamerTag: z.string().min(1, "Gamer tag is required"),
  platform: platformSchema,
});

export const friendDataSchema = z.object({
  gamerTag: z.string(),
  platformUserId: z.string(),
  totalHours: z.number(),
  lastPlayed: z.string(),
  topGames: z.array(z.object({
    name: z.string(),
    hoursPlayed: z.number(),
    platform: platformSchema,
  })).max(3),
  qualificationStatus: z.enum(["qualified", "not_qualified", "pending"]),
});

export const platformLookupResponseSchema = z.object({
  platform: platformSchema,
  player: z.object({
    id: z.string(),
    gamerTag: z.string(),
    displayName: z.string(),
    avatar: z.string(),
    lastOnline: z.string(),
  }),
  totalHours: z.number(),
  totalGames: z.number(),
  avgHoursPerGame: z.number(),
  topGames: z.array(z.object({
    id: z.string(),
    name: z.string(),
    hoursPlayed: z.number(),
    platform: platformSchema,
    lastPlayed: z.string().optional(),
  })).max(3),
  friends: z.array(friendDataSchema).optional(),
  qualificationStatus: z.enum(["qualified", "not_qualified", "pending"]),
  qualificationReason: z.string(),
});

export const authCallbackSchema = z.object({
  platform: platformSchema,
  authCode: z.string(),
  state: z.string().optional(),
});

// Qualification logic schemas
export const qualificationCriteriaSchema = z.object({
  dailyHoursMin: z.number().default(1),
  dailyHoursMax: z.number().default(3),
  yearlyHoursMin: z.number().default(1100),
});

export type PlatformLookupRequest = z.infer<typeof platformLookupRequestSchema>;
export type PlatformLookupResponse = z.infer<typeof platformLookupResponseSchema>;
export type FriendData = z.infer<typeof friendDataSchema>;
export type AuthCallback = z.infer<typeof authCallbackSchema>;
export type QualificationCriteria = z.infer<typeof qualificationCriteriaSchema>;
