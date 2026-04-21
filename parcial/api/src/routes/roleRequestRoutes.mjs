import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.mjs";
import { methodNotAllowed } from "../middleware/httpMethod.mjs";
import { roleRequestService } from "../services/roleRequestService.mjs";

export const roleRequestRouter = Router();

roleRequestRouter.use(requireAuth);

roleRequestRouter
  .route("/")
  .post((req, res, next) => {
    try {
      const roleRequest = roleRequestService.create(req.body, req.session.user);
      res.status(201).json({ roleRequest });
    } catch (error) {
      next(error);
    }
  })
  .get((req, res, next) => {
    try {
      const roleRequests = roleRequestService.list(req.session.user);
      res.json({ roleRequests });
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["GET", "POST"]));

roleRequestRouter
  .route("/:id")
  .get((req, res, next) => {
    try {
      const roleRequest = roleRequestService.getById(Number(req.params.id), req.session.user);
      res.json({ roleRequest });
    } catch (error) {
      next(error);
    }
  })
  .put((req, res, next) => {
    try {
      const roleRequest = roleRequestService.update(Number(req.params.id), req.body, req.session.user);
      res.json({ roleRequest });
    } catch (error) {
      next(error);
    }
  })
  .delete((req, res, next) => {
    try {
      roleRequestService.remove(Number(req.params.id), req.session.user);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["GET", "PUT", "DELETE"]));

roleRequestRouter
  .route("/:id/status")
  .patch(requireRole("admin"), (req, res, next) => {
    try {
      const roleRequest = roleRequestService.updateStatus(
        Number(req.params.id),
        req.body.status,
        req.session.user
      );
      res.json({ roleRequest });
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["PATCH"]));
