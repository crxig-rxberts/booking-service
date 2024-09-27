const bookingSchemas = require('../../../src/schemas/bookingSchemas');

describe('Booking Schemas', () => {
  describe('createBooking schema', () => {
    it('should validate a valid booking object', () => {
      const validBooking = {
        clientId: '123',
        providerUserSub: '456',
        timeslotId: '789',
        serviceId: 'abc',
        status: 'pending',
        notes: 'Test booking'
      };

      const { error } = bookingSchemas.createBooking.validate(validBooking);
      expect(error).toBeUndefined();
    });

    it('should allow status to be omitted and default to pending', () => {
      const bookingWithoutStatus = {
        clientId: '123',
        providerUserSub: '456',
        timeslotId: '789',
        serviceId: 'abc'
      };

      const { error, value } = bookingSchemas.createBooking.validate(bookingWithoutStatus);
      expect(error).toBeUndefined();
      expect(value.status).toBe('pending');
    });

    it('should allow notes to be omitted', () => {
      const bookingWithoutNotes = {
        clientId: '123',
        providerUserSub: '456',
        timeslotId: '789',
        serviceId: 'abc',
        status: 'confirmed'
      };

      const { error } = bookingSchemas.createBooking.validate(bookingWithoutNotes);
      expect(error).toBeUndefined();
    });

    it('should allow notes to be null or an empty string', () => {
      const bookingWithNullNotes = {
        clientId: '123',
        providerUserSub: '456',
        timeslotId: '789',
        serviceId: 'abc',
        notes: null
      };

      const bookingWithEmptyNotes = {
        clientId: '123',
        providerUserSub: '456',
        timeslotId: '789',
        serviceId: 'abc',
        notes: ''
      };

      expect(bookingSchemas.createBooking.validate(bookingWithNullNotes).error).toBeUndefined();
      expect(bookingSchemas.createBooking.validate(bookingWithEmptyNotes).error).toBeUndefined();
    });

    it('should invalidate an object with missing required fields', () => {
      const invalidBooking = {
        clientId: '123',
        providerUserSub: '456'
      };

      const { error } = bookingSchemas.createBooking.validate(invalidBooking);
      expect(error).toBeDefined();
      const errorFields = error.details.map(detail => detail.path[0]);
      expect(errorFields).toEqual(expect.arrayContaining(['timeslotId', 'serviceId']));
    });

    it('should invalidate an object with invalid status', () => {
      const bookingWithInvalidStatus = {
        clientId: '123',
        providerUserSub: '456',
        timeslotId: '789',
        serviceId: 'abc',
        status: 'invalid_status'
      };

      const { error } = bookingSchemas.createBooking.validate(bookingWithInvalidStatus);
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['status']);
    });

    it('should invalidate an object with non-string fields', () => {
      const bookingWithNonStringFields = {
        clientId: 123,
        providerUserSub: 456,
        timeslotId: 789,
        serviceId: true,
        status: 'pending'
      };

      const { error } = bookingSchemas.createBooking.validate(bookingWithNonStringFields);
      expect(error).toBeDefined();
      const errorFields = error.details.map(detail => detail.path[0]);
      expect(errorFields).toEqual(expect.arrayContaining(['clientId', 'providerUserSub', 'timeslotId', 'serviceId']));
    });
  });

  describe('updateBookingStatus schema', () => {
    it('should validate valid status values', () => {
      const validStatuses = ['confirmed', 'cancelled', 'completed'];

      validStatuses.forEach(status => {
        const { error } = bookingSchemas.updateBookingStatus.validate({ status });
        expect(error).toBeUndefined();
      });
    });

    it('should invalidate an object with missing status', () => {
      const { error } = bookingSchemas.updateBookingStatus.validate({});
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['status']);
    });

    it('should invalidate an invalid status value', () => {
      const { error } = bookingSchemas.updateBookingStatus.validate({ status: 'invalid_status' });
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['status']);
    });

    it('should invalidate a non-string status value', () => {
      const { error } = bookingSchemas.updateBookingStatus.validate({ status: 123 });
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['status']);
    });

    it('should invalidate an object with additional properties', () => {
      const { error } = bookingSchemas.updateBookingStatus.validate({ status: 'confirmed', extraProperty: 'value' });
      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['extraProperty']);
    });
  });
});
