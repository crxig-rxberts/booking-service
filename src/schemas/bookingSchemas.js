const Joi = require('joi');

const bookingSchemas = {
  createBooking: Joi.object({
    clientId: Joi.string().required(),
    providerUserSub: Joi.string().required(),
    timeslotId: Joi.string().required(),
    serviceId: Joi.string().required(),
    status: Joi.string().valid('confirmed', 'cancelled', 'completed', 'pending').default('pending'),
    notes: Joi.string().allow('', null)
  }).options({ abortEarly: false }),

  updateBookingStatus: Joi.object({
    status: Joi.string().valid('confirmed', 'cancelled', 'completed').required()
  })
};

module.exports = bookingSchemas;
