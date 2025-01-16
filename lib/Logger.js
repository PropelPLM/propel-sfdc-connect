const winston = require('winston');

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

// Custom format for log messages
const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

// Available log levels for reference
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Get log level from environment variable or default to 'info'
const defaultLogLevel = process.env.LOG_LEVEL || 'info';

// Create the logger with console-only transport
const logger = createLogger({
    format: combine(
        timestamp(),
        colorize(),
        myFormat
    ),
    transports: [
        new transports.Console({
            level: defaultLogLevel
        })
    ]
});

module.exports = { logger };
