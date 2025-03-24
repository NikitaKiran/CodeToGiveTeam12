import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping original code)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Criteria schema
export const criteriaSchema = z.object({
  name: z.string(),
  description: z.string(),
  weightage: z.number(),
});

export type Criteria = z.infer<typeof criteriaSchema>;

// Hackathon schema
export const hackathons = pgTable("hackathons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  theme: text("theme").notNull(),
  description: text("description").notNull(),
  criteria: jsonb("criteria").notNull().$type<Criteria[]>(),
  status: text("status").notNull().default("not_started"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHackathonSchema = createInsertSchema(hackathons).pick({
  name: true,
  theme: true,
  description: true,
  criteria: true,
  status: true,
});

// Submission schema
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  hackathonId: integer("hackathon_id").notNull(),
  teamName: text("team_name").notNull(),
  originalFile: text("original_file").notNull(),
  fileType: text("file_type").notNull(),
  content: text("content"),
  score: integer("score"),
  rank: integer("rank"),
  justification: text("justification"),
  criteriaScores: jsonb("criteria_scores").$type<Record<string, number>>(),
  summary: text("summary"),
  keywords: jsonb("keywords").$type<string[]>(),
  strengths: jsonb("strengths").$type<string[]>(),
  weaknesses: jsonb("weaknesses").$type<string[]>(),
  processed: boolean("processed").default(false),
  evaluated: boolean("evaluated").default(false),
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  hackathonId: true,
  teamName: true,
  originalFile: true,
  fileType: true,
  content: true,
});

export const updateSubmissionSchema = createInsertSchema(submissions).pick({
  score: true,
  rank: true,
  justification: true,
  criteriaScores: true,
  summary: true,
  keywords: true,
  strengths: true,
  weaknesses: true,
  processed: true,
  evaluated: true,
});

// Types export
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertHackathon = z.infer<typeof insertHackathonSchema>;
export type Hackathon = typeof hackathons.$inferSelect;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type UpdateSubmission = z.infer<typeof updateSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
