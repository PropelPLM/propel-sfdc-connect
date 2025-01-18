import { logger } from '../lib/Logger.js';

describe('Logger', () => {
  let testTransport;
  
  it('should be able to retrieve the logger', () => {
    expect(logger).toBeDefined();

    // Simple
    logger.debug('Test debug message');

    // Basic levels we expect to use
    logger.debug('Test debug message with data', {'data': 'debug-test'});
    logger.info('Test info message with data', {'data': 'info-test'});
    logger.warn('Test info message with data', {'data': 'warn-test'});
    logger.error('Test error message with data', {'data': 'error-test'});

    // some additional error stuff
    logger.error('Test error message with error data', new Error('Ouch!'));
    logger.error(new Error('Error message only'));
  });

});