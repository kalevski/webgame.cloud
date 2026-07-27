import type { ApiErrorCode } from '../contracts/index.js'

export class AppError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: ApiErrorCode,
        message?: string,

        public readonly params: ReadonlyArray<string | number> = []
    ) {
        super(message ?? code)
        this.name = new.target.name
    }
}

export class ValidationError extends AppError {
    constructor(code: ApiErrorCode = 'invalid_input', message?: string, params?: ReadonlyArray<string | number>) { super(400, code, message, params) }
}

export class UnauthorizedError extends AppError {
    constructor(code: ApiErrorCode = 'unauthorized', message?: string, params?: ReadonlyArray<string | number>) { super(401, code, message, params) }
}

export class ForbiddenError extends AppError {
    constructor(code: ApiErrorCode = 'forbidden', message?: string, params?: ReadonlyArray<string | number>) { super(403, code, message, params) }
}

export class NotFoundError extends AppError {
    constructor(code: ApiErrorCode = 'not_found', message?: string, params?: ReadonlyArray<string | number>) { super(404, code, message, params) }
}

export class ConflictError extends AppError {
    constructor(code: ApiErrorCode = 'conflict', message?: string, params?: ReadonlyArray<string | number>) { super(409, code, message, params) }
}

export class UnavailableError extends AppError {
    constructor(code: ApiErrorCode = 'unavailable', message?: string, params?: ReadonlyArray<string | number>) { super(503, code, message, params) }
}
