import { Router } from "express";
import { authService } from "../services/authService.mjs";
import { requireAuth } from "../middleware/auth.mjs";
import { methodNotAllowed } from "../middleware/httpMethod.mjs";

export const authRouter = Router();

function establishSession(req, user, next, onReady) {
  req.session.regenerate((regenerateError) => {
    if (regenerateError) return next(regenerateError);

    req.session.user = user;
    req.session.save((saveError) => {
      if (saveError) return next(saveError);
      return onReady();
    });
  });
}

authRouter
  .route("/signup")
  .post(async (req, res, next) => {
    try {
      const user = await authService.signup(req.body);
      establishSession(
        req,
        {
          id: user.id,
          email: user.email,
          role: user.role_name
        },
        next,
        () => {
          res.status(201).json({ user: req.session.user });
        }
      );
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["POST"]));

authRouter
  .route("/login")
  .post(async (req, res, next) => {
    try {
      const user = await authService.login(req.body);
      establishSession(req, user, next, () => {
        res.json({ user: req.session.user });
      });
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["POST"]));

authRouter
  .route("/logout")
  .post(requireAuth, (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("parcial.sid");
      return res.status(204).send();
    });
  })
  .all(methodNotAllowed(["POST"]));

authRouter
  .route("/session")
  .get(requireAuth, (req, res) => {
    res.json({ user: req.session.user });
  })
  .all(methodNotAllowed(["GET"]));
