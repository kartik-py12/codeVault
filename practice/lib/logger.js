import winston from "winston";
const {timestamp,combine,label,printf,colorize} = winston.format;


const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  format: combine(
    colorize(),
    label({ label: 'right meow!' }),
    timestamp(),
    myFormat
  ),
  transports: [new winston.transports.Console()]
});


export default logger;