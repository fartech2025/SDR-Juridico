export type AppErrorCode =
  | 'not_found'
  | 'validation_error'
  | 'database_error'
  | 'unauthorized'
  | 'forbidden'
  | 'unknown'

export class AppError extends Error {
  code: AppErrorCode

  constructor(message: string, code: AppErrorCode = 'unknown') {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}
