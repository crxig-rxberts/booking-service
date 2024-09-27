const errorHandler = require('../../../src/middleware/errorHandler');
const { formatResponse } = require('../../../src/utils/formatResponse');
const logger = require('../../../src/utils/logger');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError
} = require('../../../src/middleware/errors');

jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/formatResponse');

describe('Error Handler Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
    formatResponse.mockImplementation((message, data, success) => ({ message, data, success }));
  });

  it('should handle ValidationError', () => {
    const error = new ValidationError('Validation failed');
    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      data: null,
      success: false
    });
  });

  it('should handle NotFoundError', () => {
    const error = new NotFoundError('Resource not found');
    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Resource not found',
      data: null,
      success: false
    });
  });

  it('should handle ConflictError', () => {
    const error = new ConflictError('Resource already exists');
    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Resource already exists',
      data: null,
      success: false
    });
  });

  it('should handle UnauthorizedError', () => {
    const error = new UnauthorizedError('Unauthorized access');
    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Unauthorized access',
      data: null,
      success: false
    });
  });

  it('should handle ForbiddenError', () => {
    const error = new ForbiddenError('Forbidden access');
    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Forbidden access',
      data: null,
      success: false
    });
  });

  it('should handle unknown errors', () => {
    const error = new Error('Internal server error');
    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(logger.error).toHaveBeenCalledWith('Unknown Error caught by middleware', { error });
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal server error',
      data: null,
      success: false
    });
  });
});
