var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertSpouseSchema: () => insertSpouseSchema,
  spouses: () => spouses
});
import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var spouses = pgTable("spouses", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  spouseName: text("spouse_name").notNull(),
  imageData: text("image_data").notNull()
  // Base64 encoded image data
});
var insertSpouseSchema = createInsertSchema(spouses).omit({ id: true }).extend({
  userName: z.string().min(2, "Username must be at least 2 characters"),
  spouseName: z.string().min(1, "Spouse name is required"),
  imageData: z.string().min(1, "Image is required")
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
var DatabaseStorage = class {
  async getSpouses() {
    try {
      return await db.select().from(spouses);
    } catch (error) {
      console.error("Database error fetching spouses:", error);
      throw new Error("Failed to fetch spouses from database");
    }
  }
  async createSpouse(insertSpouse) {
    try {
      const [spouse] = await db.insert(spouses).values(insertSpouse).returning();
      if (!spouse) {
        throw new Error("Failed to create spouse record");
      }
      return spouse;
    } catch (error) {
      console.error("Database error creating spouse:", error);
      throw new Error("Failed to create spouse in database");
    }
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { fromZodError } from "zod-validation-error";
function registerRoutes(app2) {
  app2.get("/api/spouses", async (_req, res) => {
    try {
      const spouses2 = await storage.getSpouses();
      res.json(spouses2);
    } catch (err) {
      const error = err;
      console.error("Error fetching spouses:", error);
      res.status(500).json({
        message: "Failed to fetch spouses",
        details: process.env.NODE_ENV === "development" ? error.message : void 0
      });
    }
  });
  app2.post("/api/spouses", async (req, res) => {
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
      const error = err;
      console.error("Error creating spouse:", error);
      res.status(500).json({
        message: "Failed to add spouse",
        details: process.env.NODE_ENV === "development" ? error.message : void 0
      });
    }
  });
  return createServer(app2);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server error:", err);
    res.status(status).json({ message });
  });
  if (process.env.NODE_ENV === "production") {
    const distPath = path3.join(__dirname3, "..", "dist", "public");
    app.use(express2.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path3.join(distPath, "index.html"));
    });
    log("Production mode: serving static files from " + distPath);
  } else {
    await setupVite(app, server);
  }
  const PORT = parseInt(process.env.PORT || "3000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
})();
