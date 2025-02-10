import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertSpouseSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export function registerRoutes(app: Express) {
  app.get("/api/spouses", async (_req, res) => {
    try {
      const spouses = await storage.getSpouses();
      res.json(spouses);
    } catch (err) {
      const error = err as Error;
      console.error("Error fetching spouses:", error);
      res.status(500).json({ 
        message: "Failed to fetch spouses",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/spouses", async (req, res) => {
    try {
      const result = insertSpouseSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error("Validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }

      const spouse = await storage.createSpouse(result.data);
      res.status(201).json(spouse);
    } catch (err) {
      const error = err as Error;
      console.error("Error creating spouse:", error);
      res.status(500).json({ 
        message: "Failed to add spouse",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
  });

  return createServer(app);
}