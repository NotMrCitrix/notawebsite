import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const spouses = pgTable("spouses", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  spouseName: text("spouse_name").notNull(),
  imageData: text("image_data").notNull(), // Base64 encoded image data
});

export const insertSpouseSchema = createInsertSchema(spouses)
  .omit({ id: true })
  .extend({
    userName: z.string().min(2, "Username must be at least 2 characters"),
    spouseName: z.string().min(1, "Spouse name is required"),
    imageData: z.string().min(1, "Image is required")
  });

export type InsertSpouse = z.infer<typeof insertSpouseSchema>;
export type Spouse = typeof spouses.$inferSelect;