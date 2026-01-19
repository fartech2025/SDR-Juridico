export class AppError extends Error {
    code;
    constructor(message, code = 'unknown') {
        super(message);
        this.name = 'AppError';
        this.code = code;
    }
}
