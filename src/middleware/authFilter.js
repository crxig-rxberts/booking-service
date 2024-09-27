const { UnauthorizedError } = require('./errors');
const { verifyToken } = require('../client/authClient');

const authFilter = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new UnauthorizedError('No authorization header provided'));
  }

  const token = authHeader.split(' ')[1]; // Remove 'Bearer' prefix

  try {
    const response = await verifyToken(token);

    if (response.success) {
      req.accessToken = token;
      next();
    } else {
      throw new UnauthorizedError('Invalid token');
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if (error.response) {
      next(new UnauthorizedError(error.response.data.message || 'Token verification failed'));
    } else if (error.request) {
      next(new UnauthorizedError('No response received from authentication server'));
    } else {
      next(new UnauthorizedError('Error occurred during authentication'));
    }
  }
};

module.exports = authFilter;
