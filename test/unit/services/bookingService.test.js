const BookingService = require('../../../src/services/bookingService');
const bookingModel = require('../../../src/models/bookingModel');
const { NotFoundError } = require('../../../src/middleware/errors');
const logger = require('../../../src/utils/logger');
const axios = require('axios');

jest.mock('../../../src/models/bookingModel');
jest.mock('../../../src/utils/logger');
jest.mock('axios');

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    axios.put.mockReset();
    jest.restoreAllMocks();
  });

  describe('createBooking', () => {
    it('should create a booking and update timeslot status', async () => {
      const bookingData = {
        clientId: '123',
        providerUserSub: '456',
        timeslotId: '789',
        serviceId: 'abc'
      };
      const createdBooking = { id: 'def', ...bookingData };

      bookingModel.create.mockResolvedValue(createdBooking);
      jest.spyOn(BookingService, 'updateTimeslotStatus').mockResolvedValue();

      const result = await BookingService.createBooking(bookingData);

      expect(bookingModel.create).toHaveBeenCalledWith(bookingData);
      expect(BookingService.updateTimeslotStatus).toHaveBeenCalledWith(
        bookingData.providerUserSub,
        bookingData.timeslotId,
        'booked',
        createdBooking.id
      );
      expect(result).toEqual(createdBooking);
    });

    it('should handle timeslot update failure', async () => {
      const bookingData = {
        clientId: '123',
        providerUserSub: '456',
        timeslotId: '789',
        serviceId: 'abc'
      };
      const createdBooking = { id: 'def', ...bookingData };

      bookingModel.create.mockResolvedValue(createdBooking);
      jest.spyOn(BookingService, 'updateTimeslotStatus').mockRejectedValue(new Error('Timeslot update failed'));

      await expect(BookingService.createBooking(bookingData)).rejects.toThrow('Booking created but failed to update timeslot');
      expect(logger.error).toHaveBeenCalledWith('Error updating timeslot', expect.any(Object));
    });
  });

  describe('getBooking', () => {
    it('should retrieve a booking', async () => {
      const id = 'abc';
      const clientId = '123';
      const booking = { id, clientId, providerUserSub: '456', timeslotId: '789' };

      bookingModel.get.mockResolvedValue(booking);

      const result = await BookingService.getBooking(id, clientId);

      expect(bookingModel.get).toHaveBeenCalledWith(id, clientId);
      expect(result).toEqual(booking);
    });

    it('should throw NotFoundError if booking does not exist', async () => {
      bookingModel.get.mockResolvedValue(null);

      await expect(BookingService.getBooking('nonexistent', '123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status', async () => {
      const id = 'abc';
      const clientId = '123';
      const status = 'confirmed';
      const updatedBooking = { id, clientId, status };

      bookingModel.get.mockResolvedValue({ id, clientId });
      bookingModel.update.mockResolvedValue(updatedBooking);

      const result = await BookingService.updateBookingStatus(id, clientId, status);

      expect(bookingModel.get).toHaveBeenCalledWith(id, clientId);
      expect(bookingModel.update).toHaveBeenCalledWith(id, clientId, { status });
      expect(result).toEqual(updatedBooking);
    });

    it('should throw NotFoundError if booking does not exist', async () => {
      bookingModel.get.mockResolvedValue(null);

      await expect(BookingService.updateBookingStatus('nonexistent', '123', 'confirmed'))
        .rejects.toThrow(NotFoundError);
    });


    it('should update timeslot status to available when booking is cancelled', async () => {
      const id = 'abc';
      const clientId = '123';
      const status = 'cancelled';
      const booking = { id, clientId, providerUserSub: '456', timeslotId: '789' };
      const updatedBooking = { ...booking, status };

      bookingModel.get.mockResolvedValue(booking);
      bookingModel.update.mockResolvedValue(updatedBooking);
      jest.spyOn(BookingService, 'updateTimeslotStatus').mockResolvedValue();

      await BookingService.updateBookingStatus(id, clientId, status);

      expect(BookingService.updateTimeslotStatus).toHaveBeenCalledWith(booking.providerUserSub, booking.timeslotId, 'available', null);
    });

    it('should log error if timeslot update fails when cancelling booking', async () => {
      const id = 'abc';
      const clientId = '123';
      const status = 'cancelled';
      const booking = { id, clientId, providerUserSub: '456', timeslotId: '789' };
      const updatedBooking = { ...booking, status };

      bookingModel.get.mockResolvedValue(booking);
      bookingModel.update.mockResolvedValue(updatedBooking);
      jest.spyOn(BookingService, 'updateTimeslotStatus').mockRejectedValue(new Error('Timeslot update failed'));

      await BookingService.updateBookingStatus(id, clientId, status);

      expect(logger.error).toHaveBeenCalledWith('Error updating timeslot status to available', expect.any(Object));
    });
  });

  describe('getBookingsByProvider', () => {
    it('should retrieve bookings for a provider', async () => {
      const providerUserSub = '456';
      const bookings = [
        { id: 'abc', clientId: '123', providerUserSub },
        { id: 'def', clientId: '234', providerUserSub }
      ];

      bookingModel.getByProvider.mockResolvedValue(bookings);

      const result = await BookingService.getBookingsByProvider(providerUserSub);

      expect(bookingModel.getByProvider).toHaveBeenCalledWith(providerUserSub);
      expect(result).toEqual(bookings);
    });

    it('should return an empty array if no bookings found', async () => {
      bookingModel.getByProvider.mockResolvedValue([]);

      const result = await BookingService.getBookingsByProvider('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getBookingsByClient', () => {
    it('should retrieve bookings for a client', async () => {
      const clientId = '123';
      const bookings = [
        { id: 'abc', clientId, providerUserSub: '456' },
        { id: 'def', clientId, providerUserSub: '567' }
      ];

      bookingModel.getByClient.mockResolvedValue(bookings);

      const result = await BookingService.getBookingsByClient(clientId);

      expect(bookingModel.getByClient).toHaveBeenCalledWith(clientId);
      expect(result).toEqual(bookings);
    });

    it('should return an empty array if no bookings found', async () => {
      bookingModel.getByClient.mockResolvedValue([]);

      const result = await BookingService.getBookingsByClient('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('updateTimeslotStatus', () => {
    it('should update timeslot status successfully', async () => {
      const providerUserSub = '456';
      const timeslotId = '789';
      const status = 'booked';
      const serviceId = 'abc';

      axios.put.mockResolvedValue({ data: { success: true, data: { status } } });

      const result = await BookingService.updateTimeslotStatus(providerUserSub, timeslotId, status, serviceId);

      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/api/timeslots/${providerUserSub}/${timeslotId}`),
        { status, serviceId }
      );
      expect(result).toEqual({ status });
    });
  });
});
