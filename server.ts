import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/routes";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Setup large JSON payload handling for base64 images
  app.use(express.json({ limit: "100mb" }));

  // Mount API router
  app.use("/api", apiRouter);

  // Error handling middleware for API routes and bodyParser errors
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error("Express Error Middleware:", err?.message || err);
      if (err?.type === "entity.too.large") {
        res.status(413).json({
          error:
            "Payload too large. Please upload smaller images or fewer at a time.",
        });
        return;
      }
      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({ error: "Invalid JSON format in request." });
        return;
      }
      next(err);
    }
  );

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server launched successfully and listening on http://localhost:${PORT}`
    );
  });
}

startServer();
