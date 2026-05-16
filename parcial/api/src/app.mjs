import express from "express";
import helmet from "helmet";
import { bookingRouter } from "./routes/bookingRoutes.mjs";
import { roleRequestRouter } from "./routes/roleRequestRoutes.mjs";
import { corsMiddleware } from "./middleware/cors.mjs";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.mjs";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false
    })
  );

  app.use(corsMiddleware);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/bookings", bookingRouter);
  app.use("/api/role-requests", roleRequestRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
