import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.mjs";
import { methodNotAllowed } from "../middleware/httpMethod.mjs";
import { roleRequestService } from "../services/roleRequestService.mjs";

export const roleRequestRouter = Router();

roleRequestRouter.use(requireAuth);

roleRequestRouter
  .route("/")
  .post(async (req, res, next) => {
    try {
      const roleRequest = await roleRequestService.create(req.body, req.auth);
      res.status(201).json({ roleRequest });
    } catch (error) {
      next(error);
    }
  })
  .get(async (req, res, next) => {
    try {
      const roleRequests = await roleRequestService.list(req.auth);
      res.json({ roleRequests });
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["GET", "POST"]));

roleRequestRouter
  .route("/:id")
  .get(async (req, res, next) => {
    try {
      const roleRequest = await roleRequestService.getById(req.params.id, req.auth);
      res.json({ roleRequest });
    } catch (error) {
      next(error);
    }
  })
  .put(async (req, res, next) => {
    try {
      const roleRequest = await roleRequestService.update(req.params.id, req.body, req.auth);
      res.json({ roleRequest });
    } catch (error) {
      next(error);
    }
  })
  .delete(async (req, res, next) => {
    try {
      await roleRequestService.remove(req.params.id, req.auth);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["GET", "PUT", "DELETE"]));

roleRequestRouter
  .route("/:id/status")
  .patch(requireRole("admin"), async (req, res, next) => {
    try {
      const roleRequest = await roleRequestService.updateStatus(req.params.id, req.body.status, req.auth);
      res.json({ roleRequest });
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["PATCH"]));
