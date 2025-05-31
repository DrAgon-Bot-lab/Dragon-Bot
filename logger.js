const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '..', 'logs');
        this.logFile = path.join(this.logDir, 'bot.log');
        this.initializeLogDir();
    }

    initializeLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (data) {
            if (data instanceof Error) {
                logMessage += `\n${data.stack}`;
            } else if (typeof data === 'object') {
                logMessage += `\n${JSON.stringify(data, null, 2)}`;
            } else {
                logMessage += ` ${data}`;
            }
        }
        
        return logMessage;
    }

    writeToFile(message) {
        try {
            fs.appendFileSync(this.logFile, message + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    info(message, data = null) {
        const formattedMessage = this.formatMessage('info', message, data);
        console.log(`\x1b[36m${formattedMessage}\x1b[0m`); // Cyan
        this.writeToFile(formattedMessage);
    }

    warn(message, data = null) {
        const formattedMessage = this.formatMessage('warn', message, data);
        console.warn(`\x1b[33m${formattedMessage}\x1b[0m`); // Yellow
        this.writeToFile(formattedMessage);
    }

    error(message, data = null) {
        const formattedMessage = this.formatMessage('error', message, data);
        console.error(`\x1b[31m${formattedMessage}\x1b[0m`); // Red
        this.writeToFile(formattedMessage);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const formattedMessage = this.formatMessage('debug', message, data);
            console.log(`\x1b[35m${formattedMessage}\x1b[0m`); // Magenta
            this.writeToFile(formattedMessage);
        }
    }

    success(message, data = null) {
        const formattedMessage = this.formatMessage('success', message, data);
        console.log(`\x1b[32m${formattedMessage}\x1b[0m`); // Green
        this.writeToFile(formattedMessage);
    }
}

module.exports = new Logger();
