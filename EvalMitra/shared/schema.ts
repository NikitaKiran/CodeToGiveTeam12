import { pgTable, text, serial, integer, boolean, jsonb, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping original code)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  start_date: date("start_date").notNull(),  // Changed from timestamp() to date()
  end_date: date("end_date").notNull(),      // Changed from timestamp() to date()
  cutoff_score: jsonb("cutoff_score").notNull().$type<number[]>(), // Ensure it's an array of numbers
  status: text("status").notNull().default("not_started"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHackathonSchema = createInsertSchema(hackathons).pick({
  name: true,
  theme: true,
  description: true,
  criteria: true,
  start_date: true,
  end_date: true,
  cutoff_score: true,
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
  justification: jsonb("justification").$type<Record<string, string>>(),
  criteriaScores: jsonb("criteria_scores").$type<Record<string, number>>(),
  oldCriteriaScores: jsonb("old_criteria_scores").$type<Record<string, number>>(),
  summary: text("summary"),
  keywords: jsonb("keywords").$type<string[]>(),
  strengths: jsonb("strengths").$type<string[]>(),
  weaknesses: jsonb("weaknesses").$type<string[]>(),
  processed: boolean("processed").default(false),
  evaluated: boolean("evaluated").default(false),
});

// export interface Submission {
//   id: number;
//   hackathonId: number;
//   teamName: string;
//   originalFile: string;
//   fileType: string;
//   content: string | null;
//   score: number | null;
//   rank: number | null;
//   justification: Record<string, string> | null;
//   criteriaScores: Record<string, number>  | null;
//   oldCriteriaScores: Record<string, number>| null;
//   summary: string | null;
//   keywords: string[] | null;
//   strengths: string[] | null;
//   weaknesses: string[] | null;
//   processed: boolean;
//   evaluated: boolean;
// }

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  hackathonId: true,
  teamName: true,
  originalFile: true,
  fileType: true,
  content: true,
  justification: true,
  criteriaScores: true,
  summary: true,
  keywords: true,
  strengths: true,
  weaknesses: true,
  processed: true,
  evaluated: true,
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



export type InsertHackathon = z.infer<typeof insertHackathonSchema>;
export type Hackathon = typeof hackathons.$inferSelect;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type UpdateSubmission = z.infer<typeof updateSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
