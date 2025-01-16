import winston from 'winston';

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

// Get log level from environment variable or default to 'info'
const defaultLogLevel = process.env.LOG_LEVEL || 'info';

// Create the logger with console-only transport
export const logger = createLogger({
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
