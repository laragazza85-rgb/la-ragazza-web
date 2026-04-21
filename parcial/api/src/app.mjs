import express from "express";
import session from "express-session";
import helmet from "helmet";
import { env, isProduction } from "./config/env.mjs";
import { authRouter } from "./routes/authRoutes.mjs";
import { bookingRouter } from "./routes/bookingRoutes.mjs";
import { roleRequestRouter } from "./routes/roleRequestRoutes.mjs";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.mjs";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      name: "parcial.sid",
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      unset: "destroy",
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 8
      }
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/bookings", bookingRouter);
  app.use("/api/role-requests", roleRequestRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
