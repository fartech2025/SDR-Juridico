export type AppErrorCode =
  | 'not_found'
  | 'validation_error'
  | 'database_error'
  | 'unauthorized'
  | 'forbidden'
  | 'permission_denied'
  | 'auth_error'
  | 'storage_error'
  | 'unknown_error'
  | 'unknown'

export class AppError extends Error {
  code: AppErrorCode

  constructor(message: string, code: AppErrorCode = 'unknown') {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}
