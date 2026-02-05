// scripts/dou/logger.ts
import * as fs from 'fs'
import * as path from 'path'
import { DOU_CONFIG } from './config'

function ensureLogDir() {
  const dir = path.resolve(DOU_CONFIG.logDir)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function timestamp(): string {
  return new Date().toISOString()
}

function writeLog(level: string, message: string, data?: unknown) {
  const logLine = `[${timestamp()}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`
  console.log(logLine)

  try {
    const dir = ensureLogDir()
    const today = new Date().toISOString().slice(0, 10)
    const logFile = path.join(dir, `dou-${today}.log`)
    fs.appendFileSync(logFile, logLine + '\n')
  } catch {
    // Se não conseguir escrever no arquivo, pelo menos logou no console
  }
}

export const logger = {
  info: (message: string, data?: unknown) => writeLog('INFO', message, data),
  warn: (message: string, data?: unknown) => writeLog('WARN', message, data),
  error: (message: string, data?: unknown) => writeLog('ERROR', message, data),
}
