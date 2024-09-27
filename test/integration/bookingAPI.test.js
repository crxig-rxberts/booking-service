const request = require('supertest');
const app = require('../../src/app');
const { docClient } = require('../../src/config/dynamodb');
const authFilter = require('../../src/middleware/authFilter');
const axios = require('axios');

jest.mock('../../src/config/dynamodb');
jest.mock('../../src/utils/logger');
jest.mock('../../src/middleware/authFilter');
jest.mock('axios');

describe('Booking API Integration Tests', () => {
  const mockBooking = {
    clientId: 'test-client-id',
    providerUserSub: 'test-provider-sub',
    timeslotId: 'test-timeslot-id',
    serviceId: 'test-service-id',
    status: 'pending',
    notes: 'Test booking'
  };

  const mockToken = 'mock-token';

  beforeEach(() => {
    jest.clearAllMocks();
    authFilter.mockImplementation((req, res, next) => next());
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      docClient.put.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      axios.put.mockResolvedValue({ data: { success: true } });

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(mockBooking)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking created successfully');
      expect(response.body.data).toMatchObject(mockBooking);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return 400 for invalid input', async () => {
      const invalidBooking = { ...mockBooking, clientId: null };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(invalidBooking)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('"clientId" must be a string');
    });
  });

  describe('GET /api/bookings/id/:id/:clientId', () => {
    it('should get an existing booking', async () => {
      const mockBookingWithId = { ...mockBooking, id: 'test-booking-id' };
      docClient.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: mockBookingWithId })
      });

      const response = await request(app)
        .get(`/api/bookings/id/${mockBookingWithId.id}/${mockBookingWithId.clientId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking retrieved successfully');
      expect(response.body.data).toEqual(mockBookingWithId);
    });
  });

  describe('PUT /api/bookings/id/:id/:clientId/status', () => {
    it('should update booking status', async () => {
      const mockBookingWithId = { ...mockBooking, id: 'test-booking-id' };
      docClient.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: mockBookingWithId })
      });
      docClient.update.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Attributes: { ...mockBookingWithId, status: 'confirmed' } })
      });

      const response = await request(app)
        .put(`/api/bookings/id/${mockBookingWithId.id}/${mockBookingWithId.clientId}/status`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking status updated successfully');
      expect(response.body.data.status).toBe('confirmed');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put('/api/bookings/id/test-id/test-client/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('"status" must be one of [confirmed, cancelled, completed]');
    });
  });

  describe('GET /api/bookings/provider/:providerUserSub', () => {
    it('should get bookings for a provider', async () => {
      const mockBookings = [
        { ...mockBooking, id: 'booking-1' },
        { ...mockBooking, id: 'booking-2' }
      ];
      docClient.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockBookings })
      });

      const response = await request(app)
        .get(`/api/bookings/provider/${mockBooking.providerUserSub}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Provider bookings retrieved successfully');
      expect(response.body.data).toEqual(mockBookings);
    });
  });

  describe('GET /api/bookings/client/:clientId', () => {
    it('should get bookings for a client', async () => {
      const mockBookings = [
        { ...mockBooking, id: 'booking-1' },
        { ...mockBooking, id: 'booking-2' }
      ];
      docClient.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockBookings })
      });

      const response = await request(app)
        .get(`/api/bookings/client/${mockBooking.clientId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Client bookings retrieved successfully');
      expect(response.body.data).toEqual(mockBookings);
    });
  });
});
