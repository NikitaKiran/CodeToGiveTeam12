import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(), // text, audio, image, video, pdf, docx
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  bucketName: text("bucket_name").notNull(),
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

// File format validation schemas
export const supportedFormats = {
  text: [".txt", ".md", ".js", ".json", ".html", ".css", ".ts", ".tsx"],
  audio: [".mp3", ".wav", ".ogg", ".m4a"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  video: [".mp4", ".webm", ".mov", ".avi"],
  pdf: [".pdf"],
  docx: [".doc", ".docx"]
};

export const fileExtensionSchema = z.object({
  fileType: z.enum(["text", "audio", "image", "video", "pdf", "docx"]),
  file: z.instanceof(File).refine(
    (file) => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const allowedExtensions = supportedFormats[file.fileType as keyof typeof supportedFormats];
      return allowedExtensions.includes(extension);
    },
    {
      message: "File extension not supported for selected format",
    }
  ),
});

/ Criteria schema
export const criteriaSchema = z.object({
  name: z.string(),
  description: z.string(),
  weightage: z.number(),
});

export type Criteria = z.infer<typeof criteriaSchema>;
export type Hackathon = typeof hackathons.$inferSelect;

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



