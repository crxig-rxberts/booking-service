const BookingModel = require('../../../src/models/bookingModel');
const { docClient } = require('../../../src/config/dynamodb');

jest.mock('../../../src/config/dynamodb', () => ({
  docClient: {
    put: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
  },
  TABLE_NAME: 'bookings',
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

describe('BookingModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new booking', async () => {
      const bookingData = {
        clientId: 'client123',
        providerUserSub: 'provider456',
        status: 'pending',
      };

      docClient.put.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const result = await BookingModel.create(bookingData);

      expect(docClient.put).toHaveBeenCalledWith({
        TableName: 'bookings',
        Item: expect.objectContaining({
          id: 'mocked-uuid',
          ...bookingData,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'mocked-uuid',
        ...bookingData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }));
    });
  });

  describe('get', () => {
    it('should get a booking by id and clientId', async () => {
      const id = 'booking123';
      const clientId = 'client456';
      const mockBooking = { id, clientId, status: 'confirmed' };

      docClient.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: mockBooking }),
      });

      const result = await BookingModel.get(id, clientId);

      expect(docClient.get).toHaveBeenCalledWith({
        TableName: 'bookings',
        Key: { id, clientId },
      });

      expect(result).toEqual(mockBooking);
    });
  });

  describe('update', () => {
    it('should update a booking', async () => {
      const id = 'booking789';
      const clientId = 'client101';
      const updateData = { status: 'completed' };
      const mockUpdatedBooking = { id, clientId, ...updateData, updatedAt: expect.any(String) };

      docClient.update.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Attributes: mockUpdatedBooking }),
      });

      const result = await BookingModel.update(id, clientId, updateData);

      expect(docClient.update).toHaveBeenCalledWith({
        TableName: 'bookings',
        Key: { id, clientId },
        UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'completed',
          ':updatedAt': expect.any(String),
        },
        ReturnValues: 'ALL_NEW',
      });

      expect(result).toEqual(mockUpdatedBooking);
    });
  });

  describe('getByProvider', () => {
    it('should get bookings by provider', async () => {
      const providerUserSub = 'provider202';
      const mockBookings = [
        { id: 'booking1', providerUserSub, clientId: 'client1' },
        { id: 'booking2', providerUserSub, clientId: 'client2' },
      ];

      docClient.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockBookings }),
      });

      const result = await BookingModel.getByProvider(providerUserSub);

      expect(docClient.query).toHaveBeenCalledWith({
        TableName: 'bookings',
        IndexName: 'ProviderIndex',
        KeyConditionExpression: 'providerUserSub = :providerUserSub',
        ExpressionAttributeValues: { ':providerUserSub': providerUserSub },
      });

      expect(result).toEqual(mockBookings);
    });
  });

  describe('getByClient', () => {
    it('should get bookings by client', async () => {
      const clientId = 'client303';
      const mockBookings = [
        { id: 'booking3', clientId, providerUserSub: 'provider1' },
        { id: 'booking4', clientId, providerUserSub: 'provider2' },
      ];

      docClient.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockBookings }),
      });

      const result = await BookingModel.getByClient(clientId);

      expect(docClient.query).toHaveBeenCalledWith({
        TableName: 'bookings',
        IndexName: 'ClientIndex',
        KeyConditionExpression: 'clientId = :clientId',
        ExpressionAttributeValues: { ':clientId': clientId },
      });

      expect(result).toEqual(mockBookings);
    });
  });
});
