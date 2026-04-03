import fs from 'fs';
import path from 'path';
import winston from 'winston';

const logsDirectory = path.resolve(process.cwd(), 'logs');

if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory, { recursive: true });
}

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: baseFormat,
  defaultMeta: { service: 'cloudops-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, requestId, ...meta }) => {
          const suffix = Object.keys(meta).length > 0
            ? ` ${JSON.stringify(meta)}`
            : '';
          const requestLabel = requestId ? ` [${String(requestId)}]` : '';

          return `${timestamp} ${level}${requestLabel}: ${message}${suffix}`;
        })
      )
    }),
    new winston.transports.File({ filename: path.join(logsDirectory, 'error.log'), level: 'error', format: baseFormat }),
    new winston.transports.File({ filename: path.join(logsDirectory, 'combined.log'), format: baseFormat })
  ]
});
