import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.mjs";
import { methodNotAllowed } from "../middleware/httpMethod.mjs";
import { bookingService } from "../services/bookingService.mjs";

export const bookingRouter = Router();

bookingRouter.use(requireAuth);

bookingRouter
  .route("/")
  .post((req, res, next) => {
    try {
      const booking = bookingService.createBooking(req.body, req.session.user);
      res.status(201).json({ booking });
    } catch (error) {
      next(error);
    }
  })
  .get((req, res, next) => {
    try {
      const bookings = bookingService.listBookings(req.session.user);
      res.json({ bookings });
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["GET", "POST"]));

bookingRouter
  .route("/:id")
  .get((req, res, next) => {
    try {
      const booking = bookingService.getBookingById(Number(req.params.id), req.session.user);
      res.json({ booking });
    } catch (error) {
      next(error);
    }
  })
  .put((req, res, next) => {
    try {
      const booking = bookingService.updateBooking(Number(req.params.id), req.body, req.session.user);
      res.json({ booking });
    } catch (error) {
      next(error);
    }
  })
  .delete((req, res, next) => {
    try {
      bookingService.deleteBooking(Number(req.params.id), req.session.user);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["GET", "PUT", "DELETE"]));

bookingRouter
  .route("/:id/status")
  .patch(requireRole("admin"), (req, res, next) => {
    try {
      const booking = bookingService.updateBookingStatus(
        Number(req.params.id),
        req.body.status,
        req.session.user
      );
      res.json({ booking });
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["PATCH"]));
