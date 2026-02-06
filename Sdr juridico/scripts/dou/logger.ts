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

function ensureDebugDir() {
  const dir = path.join(ensureLogDir(), 'debug')
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
    // Se nao conseguir escrever no arquivo, pelo menos logou no console
  }
}

function writeDebugFile(name: string, data: unknown): string | null {
  try {
    const dir = ensureDebugDir()
    const ts = timestamp().replace(/[:.]/g, '-')
    const filePath = path.join(dir, `${ts}-${name}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    console.log(`[DEBUG FILE] ${filePath}`)
    return filePath
  } catch (error) {
    console.error('[DEBUG FILE] Erro ao gravar', error)
    return null
  }
}

export const logger = {
  info: (message: string, data?: unknown) => writeLog('INFO', message, data),
  warn: (message: string, data?: unknown) => writeLog('WARN', message, data),
  error: (message: string, data?: unknown) => writeLog('ERROR', message, data),
}

export const debugWriter = {
  write: writeDebugFile,
}
