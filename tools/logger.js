const colors = {
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
}

module.exports = class Logger {
    static log (message) {
        console.log(colors.cyan + message);
    }

    static warn (message) {
        console.warn(colors.yellow + message);
    }

    static error (message) {
        console.error(colors.red + message);
    }
}