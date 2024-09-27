const BookingController = require('../../../src/controllers/bookingController');
const bookingService = require('../../../src/services/bookingService');
const { formatResponse } = require('../../../src/utils/formatResponse');

jest.mock('../../../src/services/bookingService');
jest.mock('../../../src/utils/formatResponse');

describe('BookingController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create a booking and return 201 status', async () => {
      const bookingData = { clientId: '123', providerUserSub: '456', timeslotId: '789' };
      const createdBooking = { id: 'abc', ...bookingData };
      mockReq.body = bookingData;

      bookingService.createBooking.mockResolvedValue(createdBooking);
      formatResponse.mockReturnValue({ success: true, message: 'Booking created successfully', data: createdBooking });

      await BookingController.createBooking(mockReq, mockRes, mockNext);

      expect(bookingService.createBooking).toHaveBeenCalledWith(bookingData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Booking created successfully', data: createdBooking });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if booking creation fails', async () => {
      const error = new Error('Booking creation failed');
      mockReq.body = {};

      bookingService.createBooking.mockRejectedValue(error);

      await BookingController.createBooking(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getBooking', () => {
    it('should retrieve a booking and return 200 status', async () => {
      const bookingId = 'abc';
      const clientId = '123';
      const booking = { id: bookingId, clientId, providerUserSub: '456', timeslotId: '789' };
      mockReq.params = { id: bookingId, clientId };

      bookingService.getBooking.mockResolvedValue(booking);
      formatResponse.mockReturnValue({ success: true, message: 'Booking retrieved successfully', data: booking });

      await BookingController.getBooking(mockReq, mockRes, mockNext);

      expect(bookingService.getBooking).toHaveBeenCalledWith(bookingId, clientId);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Booking retrieved successfully', data: booking });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if booking retrieval fails', async () => {
      const error = new Error('Booking not found');
      mockReq.params = { id: 'nonexistent', clientId: '123' };

      bookingService.getBooking.mockRejectedValue(error);

      await BookingController.getBooking(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status and return 200 status', async () => {
      const bookingId = 'abc';
      const clientId = '123';
      const newStatus = 'confirmed';
      const updatedBooking = { id: bookingId, clientId, status: newStatus };
      mockReq.params = { id: bookingId, clientId };
      mockReq.body = { status: newStatus };

      bookingService.updateBookingStatus.mockResolvedValue(updatedBooking);
      formatResponse.mockReturnValue({ success: true, message: 'Booking status updated successfully', data: updatedBooking });

      await BookingController.updateBookingStatus(mockReq, mockRes, mockNext);

      expect(bookingService.updateBookingStatus).toHaveBeenCalledWith(bookingId, clientId, newStatus);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Booking status updated successfully', data: updatedBooking });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if status update fails', async () => {
      const error = new Error('Status update failed');
      mockReq.params = { id: 'abc', clientId: '123' };
      mockReq.body = { status: 'invalid' };

      bookingService.updateBookingStatus.mockRejectedValue(error);

      await BookingController.updateBookingStatus(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getBookingsByProvider', () => {
    it('should retrieve provider bookings and return 200 status', async () => {
      const providerUserSub = '456';
      const bookings = [
        { id: 'abc', clientId: '123', providerUserSub, timeslotId: '789' },
        { id: 'def', clientId: '234', providerUserSub, timeslotId: '890' }
      ];
      mockReq.params = { providerUserSub };

      bookingService.getBookingsByProvider.mockResolvedValue(bookings);
      formatResponse.mockReturnValue({ success: true, message: 'Provider bookings retrieved successfully', data: bookings });

      await BookingController.getBookingsByProvider(mockReq, mockRes, mockNext);

      expect(bookingService.getBookingsByProvider).toHaveBeenCalledWith(providerUserSub);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Provider bookings retrieved successfully', data: bookings });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array if no bookings found for provider', async () => {
      const providerUserSub = '456';
      mockReq.params = { providerUserSub };

      bookingService.getBookingsByProvider.mockResolvedValue([]);
      formatResponse.mockReturnValue({ success: true, message: 'Provider bookings retrieved successfully', data: [] });

      await BookingController.getBookingsByProvider(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Provider bookings retrieved successfully', data: [] });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if provider bookings retrieval fails', async () => {
      const error = new Error('Provider bookings retrieval failed');
      mockReq.params = { providerUserSub: '456' };

      bookingService.getBookingsByProvider.mockRejectedValue(error);

      await BookingController.getBookingsByProvider(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getBookingsByClient', () => {
    it('should retrieve client bookings and return 200 status', async () => {
      const clientId = '123';
      const bookings = [
        { id: 'abc', clientId, providerUserSub: '456', timeslotId: '789' },
        { id: 'def', clientId, providerUserSub: '567', timeslotId: '890' }
      ];
      mockReq.params = { clientId };

      bookingService.getBookingsByClient.mockResolvedValue(bookings);
      formatResponse.mockReturnValue({ success: true, message: 'Client bookings retrieved successfully', data: bookings });

      await BookingController.getBookingsByClient(mockReq, mockRes, mockNext);

      expect(bookingService.getBookingsByClient).toHaveBeenCalledWith(clientId);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Client bookings retrieved successfully', data: bookings });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array if no bookings found for client', async () => {
      const clientId = '123';
      mockReq.params = { clientId };

      bookingService.getBookingsByClient.mockResolvedValue([]);
      formatResponse.mockReturnValue({ success: true, message: 'Client bookings retrieved successfully', data: [] });

      await BookingController.getBookingsByClient(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Client bookings retrieved successfully', data: [] });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if client bookings retrieval fails', async () => {
      const error = new Error('Client bookings retrieval failed');
      mockReq.params = { clientId: '123' };

      bookingService.getBookingsByClient.mockRejectedValue(error);

      await BookingController.getBookingsByClient(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
