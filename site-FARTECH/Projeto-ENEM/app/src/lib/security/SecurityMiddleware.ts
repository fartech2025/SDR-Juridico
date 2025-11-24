/**
 * Security Middleware for Banking-Level Protection
 * Implements comprehensive security controls for request/response handling
 */

import { BankingSecurityManager } from './BankingSecurityManager';

export interface SecurityContext {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  permissions: string[];
  riskScore: number;
}

export interface SecurityRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  context: SecurityContext;
}

export interface SecurityResponse {
  allowed: boolean;
  reason?: string;
  modifiedRequest?: SecurityRequest;
  securityHeaders: Record<string, string>;
  auditData: any;
}

export class SecurityMiddleware {
  private securityManager: BankingSecurityManager;
  private rateLimiter: RateLimiter;
  private threatDetector: ThreatDetector;
  private dataValidator: DataValidator;

  constructor() {
    this.securityManager = BankingSecurityManager.getInstance();
    this.rateLimiter = new RateLimiter();
    this.threatDetector = new ThreatDetector();
    this.dataValidator = new DataValidator();
  }

  /**
   * Main security middleware function
   */
  public async processRequest(request: SecurityRequest): Promise<SecurityResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Rate limiting check
      const rateLimitResult = await this.rateLimiter.checkLimit(request.context);
      if (!rateLimitResult.allowed) {
        return this.createSecurityResponse(false, 'RATE_LIMIT_EXCEEDED', request);
      }

      // 2. Threat detection
      const threatResult = await this.threatDetector.analyzeRequest(request);
      if (threatResult.threatDetected) {
        return this.createSecurityResponse(false, `THREAT_DETECTED: ${threatResult.threatType}`, request);
      }

      // 3. Session validation
      const sessionToken = this.extractSessionToken(request);
      if (!sessionToken) {
        return this.createSecurityResponse(false, 'NO_SESSION_TOKEN', request);
      }

      const sessionValidation = await this.securityManager.validateSession(sessionToken);
      if (!sessionValidation.valid) {
        return this.createSecurityResponse(false, `SESSION_INVALID: ${sessionValidation.reason}`, request);
      }

      // 4. Permission validation
      const permissionResult = await this.validatePermissions(request, sessionValidation.sessionData);
      if (!permissionResult.allowed) {
        return this.createSecurityResponse(false, 'INSUFFICIENT_PERMISSIONS', request);
      }

      // 5. Input validation and sanitization
      const validationResult = await this.dataValidator.validateRequest(request);
      if (!validationResult.valid) {
        return this.createSecurityResponse(false, `INPUT_VALIDATION_FAILED: ${validationResult.errors.join(', ')}`, request);
      }

      // 6. Apply security transformations
      const sanitizedRequest = await this.sanitizeRequest(request);

      const processingTime = Date.now() - startTime;

      return {
        allowed: true,
        modifiedRequest: sanitizedRequest,
        securityHeaders: this.generateSecurityHeaders(),
        auditData: {
          processingTime,
          riskScore: request.context.riskScore,
          validationsPassed: ['rate_limit', 'threat_detection', 'session', 'permissions', 'input_validation']
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createSecurityResponse(false, `MIDDLEWARE_ERROR: ${errorMessage}`, request);
    }
  }

  /**
   * Validate user permissions for the requested action
   */
  private async validatePermissions(request: SecurityRequest, sessionData: any): Promise<{allowed: boolean, reason?: string}> {
    const requiredPermissions = this.getRequiredPermissions(request.url, request.method);
    const userPermissions = sessionData.permissions || [];

    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes('admin')
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(permission => 
        !userPermissions.includes(permission)
      );
      return {
        allowed: false,
        reason: `Missing permissions: ${missingPermissions.join(', ')}`
      };
    }

    return { allowed: true };
  }

  /**
   * Get required permissions based on endpoint and method
   */
  private getRequiredPermissions(url: string, method: string): string[] {
    const permissionMap: Record<string, string[]> = {
      'GET /api/questoes': ['read:questoes'],
      'POST /api/questoes': ['write:questoes', 'admin'],
      'PUT /api/questoes': ['write:questoes', 'admin'],
      'DELETE /api/questoes': ['delete:questoes', 'admin'],
      'GET /api/usuarios': ['read:usuarios', 'admin'],
      'POST /api/usuarios': ['write:usuarios', 'admin'],
      'GET /api/database/monitor': ['read:database', 'admin'],
      'POST /api/database/cleanup': ['write:database', 'admin'],
      'GET /api/security/audit': ['read:security', 'admin'],
      'POST /api/security/actions': ['write:security', 'admin']
    };

    const key = `${method} ${url}`;
    return permissionMap[key] || ['authenticated'];
  }

  /**
   * Sanitize and secure the request
   */
  private async sanitizeRequest(request: SecurityRequest): Promise<SecurityRequest> {
    const sanitizedRequest = { ...request };

    // Sanitize headers
    sanitizedRequest.headers = this.sanitizeHeaders(request.headers);

    // Sanitize body if present
    if (request.body) {
      sanitizedRequest.body = await this.dataValidator.sanitizeData(request.body);
    }

    // Add security context
    sanitizedRequest.context.timestamp = Date.now();

    return sanitizedRequest;
  }

  /**
   * Sanitize HTTP headers
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedHeaders = [
      'authorization',
      'content-type',
      'accept',
      'user-agent',
      'x-forwarded-for',
      'x-real-ip'
    ];

    for (const [key, value] of Object.entries(headers)) {
      const lowercaseKey = key.toLowerCase();
      if (allowedHeaders.includes(lowercaseKey)) {
        // Basic XSS protection for headers
        sanitized[lowercaseKey] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    }

    return sanitized;
  }

  /**
   * Generate security headers for response
   */
  private generateSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), vr=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self), push=(self)'
    };
  }

  /**
   * Extract session token from request
   */
  private extractSessionToken(request: SecurityRequest): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  /**
   * Create standardized security response
   */
  private createSecurityResponse(allowed: boolean, reason: string, request: SecurityRequest): SecurityResponse {
    return {
      allowed,
      reason,
      securityHeaders: this.generateSecurityHeaders(),
      auditData: {
        blocked: true,
        reason,
        url: request.url,
        method: request.method,
        userAgent: request.headers['user-agent'],
        ipAddress: request.context.ipAddress,
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Rate Limiter for preventing abuse
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowSize = 60000; // 1 minute
  private readonly maxRequests = 100; // per minute per user

  async checkLimit(context: SecurityContext): Promise<{allowed: boolean, remaining: number}> {
    const key = `${context.userId}:${context.ipAddress}`;
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // Get existing requests for this key
    const userRequests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return { 
      allowed: true, 
      remaining: this.maxRequests - recentRequests.length 
    };
  }
}

/**
 * Threat Detection System
 */
class ThreatDetector {
  private readonly suspiciousPatterns = [
    /(\bor\b|\band\b|\bunion\b).*(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b)/gi, // SQL injection
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
    /javascript:|data:text\/html|vbscript:|onload=|onerror=/gi, // Script injection
    /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/gi, // Path traversal
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi, // SQL injection characters
    /<iframe|<object|<embed|<applet/gi // Dangerous HTML elements
  ];

  async analyzeRequest(request: SecurityRequest): Promise<{threatDetected: boolean, threatType?: string}> {
    // Check URL for threats
    if (this.containsThreat(request.url)) {
      return { threatDetected: true, threatType: 'MALICIOUS_URL' };
    }

    // Check headers for threats
    for (const [key, value] of Object.entries(request.headers)) {
      if (this.containsThreat(value)) {
        return { threatDetected: true, threatType: `MALICIOUS_HEADER_${key.toUpperCase()}` };
      }
    }

    // Check body for threats
    if (request.body && this.containsThreat(JSON.stringify(request.body))) {
      return { threatDetected: true, threatType: 'MALICIOUS_PAYLOAD' };
    }

    // Check for suspicious user agent patterns
    const userAgent = request.headers['user-agent'] || '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      return { threatDetected: true, threatType: 'SUSPICIOUS_USER_AGENT' };
    }

    return { threatDetected: false };
  }

  private containsThreat(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousAgents = [
      'sqlmap',
      'nikto',
      'nessus',
      'openvas',
      'masscan',
      'nmap',
      'curl',
      'wget'
    ];

    return suspiciousAgents.some(agent => 
      userAgent.toLowerCase().includes(agent)
    );
  }
}

/**
 * Data Validator and Sanitizer
 */
class DataValidator {
  async validateRequest(request: SecurityRequest): Promise<{valid: boolean, errors: string[]}> {
    const errors: string[] = [];

    // Validate URL structure
    if (!this.isValidUrl(request.url)) {
      errors.push('Invalid URL format');
    }

    // Validate method
    if (!this.isValidMethod(request.method)) {
      errors.push('Invalid HTTP method');
    }

    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      const contentType = request.headers['content-type'];
      if (!this.isValidContentType(contentType)) {
        errors.push('Invalid or missing content type');
      }
    }

    // Validate body size
    if (request.body && this.isBodyTooLarge(request.body)) {
      errors.push('Request body too large');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async sanitizeData(data: any): Promise<any> {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.sanitizeData(item)));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[this.sanitizeString(key)] = await this.sanitizeData(value);
      }
      return sanitized;
    }

    return data;
  }

  private sanitizeString(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:|data:text\/html|vbscript:/gi, '') // Remove script URLs
      .replace(/onload=|onerror=|onclick=/gi, '') // Remove event handlers
      .trim();
  }

  private isValidUrl(url: string): boolean {
    return /^\/api\/[a-zA-Z0-9\/_-]+(\?[a-zA-Z0-9=&_-]*)?$/.test(url);
  }

  private isValidMethod(method: string): boolean {
    return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(method);
  }

  private isValidContentType(contentType: string): boolean {
    const validTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];
    return validTypes.some(type => contentType?.includes(type));
  }

  private isBodyTooLarge(body: any): boolean {
    const bodySize = JSON.stringify(body).length;
    return bodySize > 1024 * 1024; // 1MB limit
  }
}

export default SecurityMiddleware;