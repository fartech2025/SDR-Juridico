/**
 * Security Alert System
 * Advanced threat detection and real-time security monitoring
 */

export interface SecurityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'intrusion' | 'authentication' | 'data_access' | 'compliance' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  resolved: boolean;
  actions: SecurityAction[];
}

export interface SecurityAction {
  id: string;
  type: 'block_ip' | 'lock_account' | 'rotate_keys' | 'escalate' | 'investigate';
  label: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
}

export interface SecurityMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  resolvedToday: number;
  averageResponseTime: number;
  threatLevel: 'green' | 'yellow' | 'orange' | 'red';
  uptime: number;
}

export class SecurityAlertSystem {
  private static instance: SecurityAlertSystem;
  private alerts: SecurityAlert[] = [];
  private subscribers: ((alerts: SecurityAlert[]) => void)[] = [];

  private constructor() {
    this.initializeDefaultAlerts();
    this.startRealTimeMonitoring();
  }

  public static getInstance(): SecurityAlertSystem {
    if (!SecurityAlertSystem.instance) {
      SecurityAlertSystem.instance = new SecurityAlertSystem();
    }
    return SecurityAlertSystem.instance;
  }

  public getAlerts(): SecurityAlert[] {
    return this.alerts.slice().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getCriticalAlerts(): SecurityAlert[] {
    return this.alerts.filter(alert => alert.severity === 'critical' && !alert.resolved);
  }

  public getMetrics(): SecurityMetrics {
    const total = this.alerts.length;
    const critical = this.alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const resolvedToday = this.alerts.filter(a => 
      a.resolved && 
      a.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    const threatLevel = this.calculateThreatLevel();
    
    return {
      totalAlerts: total,
      criticalAlerts: critical,
      resolvedToday,
      averageResponseTime: 2.5, // minutes
      threatLevel,
      uptime: 99.9
    };
  }

  public subscribe(callback: (alerts: SecurityAlert[]) => void): void {
    this.subscribers.push(callback);
  }

  public unsubscribe(callback: (alerts: SecurityAlert[]) => void): void {
    const index = this.subscribers.indexOf(callback);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.notifySubscribers();
    }
  }

  public addAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: SecurityAlert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.unshift(newAlert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    this.notifySubscribers();

    // Auto-escalate critical alerts
    if (alert.severity === 'critical') {
      this.escalateCriticalAlert(newAlert);
    }
  }

  private initializeDefaultAlerts(): void {
    const defaultAlerts: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>[] = [
      {
        severity: 'medium',
        type: 'authentication',
        title: 'Múltiplas tentativas de login falhadas',
        description: 'IP 192.168.1.100 tentou fazer login 5 vezes consecutivas sem sucesso',
        source: 'Authentication System',
        actions: [
          {
            id: 'block1',
            type: 'block_ip',
            label: 'Bloquear IP',
            description: 'Bloquear acesso do IP por 24 horas',
            risk: 'low'
          },
          {
            id: 'investigate1',
            type: 'investigate',
            label: 'Investigar',
            description: 'Analisar logs detalhados do IP',
            risk: 'low'
          }
        ]
      },
      {
        severity: 'low',
        type: 'data_access',
        title: 'Acesso a dados sensíveis',
        description: 'Usuário admin acessou tabela de questões fora do horário comercial',
        source: 'Database Monitor',
        actions: [
          {
            id: 'audit1',
            type: 'investigate',
            label: 'Auditoria',
            description: 'Revisar logs de acesso do usuário',
            risk: 'low'
          }
        ]
      },
      {
        severity: 'high',
        type: 'system',
        title: 'Tentativa de SQL Injection detectada',
        description: 'Padrão malicioso detectado em parâmetros de consulta: UNION SELECT * FROM usuarios',
        source: 'WAF',
        actions: [
          {
            id: 'block2',
            type: 'block_ip',
            label: 'Bloquear Imediatamente',
            description: 'Bloquear IP e reportar tentativa de ataque',
            risk: 'high'
          },
          {
            id: 'escalate1',
            type: 'escalate',
            label: 'Escalar',
            description: 'Notificar equipe de segurança',
            risk: 'medium'
          }
        ]
      }
    ];

    defaultAlerts.forEach(alert => this.addAlert(alert));
  }

  private startRealTimeMonitoring(): void {
    // Simulate real-time security monitoring
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        this.generateRandomAlert();
      }
    }, 30000);

    // Auto-resolve some alerts
    setInterval(() => {
      const unresolvedAlerts = this.alerts.filter(a => !a.resolved && a.severity !== 'critical');
      if (unresolvedAlerts.length > 0 && Math.random() < 0.3) {
        const alertToResolve = unresolvedAlerts[Math.floor(Math.random() * unresolvedAlerts.length)];
        this.resolveAlert(alertToResolve.id);
      }
    }, 45000);
  }

  private generateRandomAlert(): void {
    const randomAlerts = [
      {
        severity: 'low' as const,
        type: 'system' as const,
        title: 'Rate limiting ativado',
        description: 'Cliente excedeu limite de requisições por minuto',
        source: 'Rate Limiter',
        actions: []
      },
      {
        severity: 'medium' as const,
        type: 'authentication' as const,
        title: 'Login de localização incomum',
        description: 'Usuário fez login de país diferente do habitual',
        source: 'GeoIP Monitor',
        actions: [
          {
            id: 'verify1',
            type: 'investigate' as const,
            label: 'Verificar Identidade',
            description: 'Solicitar verificação adicional do usuário',
            risk: 'medium' as const
          }
        ]
      },
      {
        severity: 'low' as const,
        type: 'compliance' as const,
        title: 'Backup automático concluído',
        description: 'Backup diário realizado com sucesso às ' + new Date().toLocaleTimeString(),
        source: 'Backup System',
        actions: []
      }
    ];

    const randomAlert = randomAlerts[Math.floor(Math.random() * randomAlerts.length)];
    this.addAlert(randomAlert);
  }

  private calculateThreatLevel(): 'green' | 'yellow' | 'orange' | 'red' {
    const criticalCount = this.alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const highCount = this.alerts.filter(a => a.severity === 'high' && !a.resolved).length;

    if (criticalCount > 0) return 'red';
    if (highCount >= 3) return 'orange';
    if (highCount >= 1) return 'yellow';
    return 'green';
  }

  private escalateCriticalAlert(alert: SecurityAlert): void {
    // In a real system, this would trigger:
    // - Email notifications to security team
    // - SMS alerts to on-call personnel  
    // - Integration with SIEM systems
    // - Automated response procedures
    console.warn('🚨 CRITICAL SECURITY ALERT ESCALATED:', alert);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.getAlerts()));
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Security Dashboard Widget Component
 * React component for displaying security alerts in the UI
 */
export interface SecurityDashboardProps {
  showDetails?: boolean;
  maxAlerts?: number;
}

export function createSecurityDashboard(props: SecurityDashboardProps = {}) {
  const { showDetails = true, maxAlerts = 10 } = props;
  const alertSystem = SecurityAlertSystem.getInstance();
  const alerts = alertSystem.getAlerts().slice(0, maxAlerts);
  const metrics = alertSystem.getMetrics();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-600';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-600';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-600';
      case 'low': return 'text-blue-400 bg-blue-900/30 border-blue-600';
      default: return 'text-slate-400 bg-slate-900/30 border-slate-600';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'red': return 'text-red-400 bg-red-900/50';
      case 'orange': return 'text-orange-400 bg-orange-900/50';
      case 'yellow': return 'text-yellow-400 bg-yellow-900/50';
      case 'green': return 'text-green-400 bg-green-900/50';
      default: return 'text-slate-400 bg-slate-900/50';
    }
  };

  return {
    metrics,
    alerts,
    getSeverityColor,
    getThreatLevelColor,
    resolveAlert: (id: string) => alertSystem.resolveAlert(id),
    refreshAlerts: () => alertSystem.getAlerts()
  };
}

export default SecurityAlertSystem;