import { Router } from "express";
import { requireAuth } from "../middleware/auth.mjs";
import { methodNotAllowed } from "../middleware/httpMethod.mjs";
import { bookingService } from "../services/bookingService.mjs";

export const bookingRouter = Router();

bookingRouter.use(requireAuth);

bookingRouter
  .route("/")
  .post(async (req, res, next) => {
    try {
      const booking = await bookingService.createBooking(req.body, req.auth);
      res.status(201).json({ booking });
    } catch (error) {
      next(error);
    }
  })
  .get(async (req, res, next) => {
    try {
      const bookings = await bookingService.listBookings(req.auth);
      res.json({ bookings });
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["GET", "POST"]));

bookingRouter
  .route("/:id")
  .get(async (req, res, next) => {
    try {
      const booking = await bookingService.getBookingById(req.params.id, req.auth);
      res.json({ booking });
    } catch (error) {
      next(error);
    }
  })
  .put(async (req, res, next) => {
    try {
      const booking = await bookingService.updateBooking(req.params.id, req.body, req.auth);
      res.json({ booking });
    } catch (error) {
      next(error);
    }
  })
  .delete(async (req, res, next) => {
    try {
      await bookingService.deleteBooking(req.params.id, req.auth);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["GET", "PUT", "DELETE"]));

bookingRouter
  .route("/:id/status")
  .patch(requireAuth, async (req, res, next) => {
    try {
      const booking = await bookingService.updateBookingStatus(req.params.id, req.body.status, req.auth);
      res.json({ booking });
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed(["PATCH"]));
