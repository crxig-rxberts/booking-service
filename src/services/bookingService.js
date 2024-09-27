const bookingModel = require('../models/bookingModel');
const { NotFoundError } = require('../middleware/errors');
const logger = require('../utils/logger');
const axios = require('axios');

class BookingService {
  async createBooking(bookingData) {
    try {
      const result = await bookingModel.create(bookingData);
      logger.info('Booking created successfully', { bookingId: result.id });

      try {
        await this.updateTimeslotStatus(bookingData.providerUserSub, bookingData.timeslotId, 'booked', result.id);
        logger.info('Timeslot updated successfully', { timeslotId: bookingData.timeslotId });
      } catch (timeslotError) {
        logger.error('Error updating timeslot', { error: timeslotError.message, timeslotId: bookingData.timeslotId });
        throw new Error(`Booking created but failed to update timeslot: ${timeslotError.message}`);
      }

      return result;
    } catch (error) {
      logger.error('Error creating booking', { error: error.message, bookingData });
      throw error;
    }
  }

  async updateTimeslotStatus(providerUserSub, timeslotId, status, serviceId) {
    const timeslotServiceUrl = process.env.TIMESLOT_SERVICE_URL || 'http://localhost:3006';
    const url = `${timeslotServiceUrl}/api/timeslots/${providerUserSub}/${timeslotId}`;

    try {
      const response = await axios.put(url, { status, serviceId });
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update timeslot');
      }
    } catch (error) {
      logger.error('Error calling timeslot service', { error: error.message, timeslotId });
      throw new Error('Error calling timeslot service');
    }
  }

  async getBooking(id, clientId) {
    const result = await bookingModel.get(id, clientId);
    if (!result) {
      throw new NotFoundError('Booking not found');
    }
    logger.info('Booking retrieved successfully', { id, clientId });
    return result;
  }

  async updateBookingStatus(id, clientId, status) {
    const booking = await bookingModel.get(id, clientId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const result = await bookingModel.update(id, clientId, { status });
    logger.info('Booking status updated successfully', { id, clientId, status });

    if (status === 'cancelled') {
      try {
        await this.updateTimeslotStatus(booking.providerUserSub, booking.timeslotId, 'available', null);
        logger.info('Timeslot status updated to available', { timeslotId: booking.timeslotId });
      } catch (timeslotError) {
        logger.error('Error updating timeslot status to available', { error: timeslotError.message, timeslotId: booking.timeslotId });
      }
    }

    return result;
  }

  async getBookingsByProvider(providerUserSub) {
    const result = await bookingModel.getByProvider(providerUserSub);
    if (result.length === 0) {
      logger.info('No bookings found for provider', { providerUserSub });
    } else {
      logger.info('Provider bookings retrieved successfully', { providerUserSub });
    }
    return result;
  }

  async getBookingsByClient(clientId) {
    const result = await bookingModel.getByClient(clientId);
    logger.info('Client bookings retrieved successfully', { clientId });
    return result;
  }
}

module.exports = new BookingService();
