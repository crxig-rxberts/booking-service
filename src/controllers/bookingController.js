const bookingService = require('../services/bookingService');
const { formatResponse } = require('../utils/formatResponse');

class BookingController {
  async createBooking(req, res, next) {
    try {
      const bookingData = req.body;
      const result = await bookingService.createBooking(bookingData);
      res.status(201).json(formatResponse('Booking created successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async getBooking(req, res, next) {
    try {
      const { id, clientId } = req.params;
      const result = await bookingService.getBooking(id, clientId);
      res.json(formatResponse('Booking retrieved successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async updateBookingStatus(req, res, next) {
    try {
      const { id, clientId } = req.params;
      const { status } = req.body;
      const result = await bookingService.updateBookingStatus(id, clientId, status);
      res.json(formatResponse('Booking status updated successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async getBookingsByProvider(req, res, next) {
    try {
      const { providerUserSub } = req.params;
      const result = await bookingService.getBookingsByProvider(providerUserSub);
      res.json(formatResponse('Provider bookings retrieved successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async getBookingsByClient(req, res, next) {
    try {
      const { clientId } = req.params;
      const result = await bookingService.getBookingsByClient(clientId);
      res.json(formatResponse('Client bookings retrieved successfully', result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();
