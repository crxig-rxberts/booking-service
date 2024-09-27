const express = require('express');
const bookingController = require('../controllers/bookingController');
const validateRequest = require('../utils/validateRequest');
const bookingSchemas = require('../schemas/bookingSchemas');
const authFilter = require('../middleware/authFilter');

const router = express.Router();

router.post('/', authFilter, validateRequest(bookingSchemas.createBooking), bookingController.createBooking);
router.get('/id/:id/:clientId', authFilter, bookingController.getBooking);
router.put('/id/:id/:clientId/status', authFilter, validateRequest(bookingSchemas.updateBookingStatus), bookingController.updateBookingStatus);
router.get('/provider/:providerUserSub', authFilter, bookingController.getBookingsByProvider);
router.get('/client/:clientId', authFilter, bookingController.getBookingsByClient);

module.exports = router;
