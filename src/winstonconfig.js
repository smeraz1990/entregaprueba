import winston from 'winston'

const logger = winston.createLogger({
    level: "verbose",
    transports: [
        new winston.transports.Console({ level: "verbose"}),
        new winston.transports.File({filename: "error.log", level: "error"}),
        new winston.transports.File({filename: "warn.log", level: "warn"})
    ]
})

export default logger

