import { spouses, type Spouse, type InsertSpouse } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  getSpouses(): Promise<Spouse[]>;
  createSpouse(spouse: InsertSpouse): Promise<Spouse>;
}

export class DatabaseStorage implements IStorage {
  async getSpouses(): Promise<Spouse[]> {
    try {
      return await db.select().from(spouses);
    } catch (error) {
      console.error("Database error fetching spouses:", error);
      throw new Error("Failed to fetch spouses from database");
    }
  }

  async createSpouse(insertSpouse: InsertSpouse): Promise<Spouse> {
    try {
      const [spouse] = await db
        .insert(spouses)
        .values(insertSpouse)
        .returning();

      if (!spouse) {
        throw new Error("Failed to create spouse record");
      }

      return spouse;
    } catch (error) {
      console.error("Database error creating spouse:", error);
      throw new Error("Failed to create spouse in database");
    }
  }
}

export const storage = new DatabaseStorage();