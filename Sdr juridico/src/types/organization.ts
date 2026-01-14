// Types for Multi-Tenant Organization System
// Date: 2026-01-13

export type OrganizationStatus = 'pending' | 'active' | 'suspended' | 'cancelled'

export type OrganizationPlan = 'trial' | 'basic' | 'professional' | 'enterprise'

export type BillingCycle = 'monthly' | 'yearly'

export interface Organization {
  id: string
  
  // Basic Info
  name: string
  slug: string
  cnpj: string | null
  email: string
  phone: string | null
  address: OrganizationAddress | null
  
  // Plan and Limits
  plan: OrganizationPlan
  max_users: number
  max_storage_gb: number
  max_cases: number | null
  
  // Status
  status: OrganizationStatus
  
  // Billing
  billing_email: string | null
  billing_cycle: BillingCycle
  next_billing_date: string | null
  
  // Branding
  logo_url: string | null
  primary_color: string
  secondary_color: string | null
  custom_domain: string | null
  
  // Metadata
  settings: OrganizationSettings
  metadata: Record<string, any>
  
  // Timestamps
  created_at: string
  updated_at: string
  activated_at: string | null
  suspended_at: string | null
  cancelled_at: string | null
  
  // Management
  provisioned_by: string | null
  managed_by: string | null
}

export interface OrganizationAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  country: string
}

export interface OrganizationSettings {
  // Features enabled
  features?: {
    google_calendar?: boolean
    microsoft_teams?: boolean
    datajud?: boolean
    document_automation?: boolean
    reporting?: boolean
  }
  
  // Notifications
  notifications?: {
    email_enabled?: boolean
    sms_enabled?: boolean
    webhook_url?: string
  }
  
  // Business hours
  business_hours?: {
    timezone?: string
    start_time?: string // "09:00"
    end_time?: string // "18:00"
    working_days?: number[] // [1,2,3,4,5] Mon-Fri
  }
  
  // Customization
  customization?: {
    show_branding?: boolean
    custom_footer?: string
    custom_css?: string
  }
  
  // Security
  security?: {
    require_2fa?: boolean
    password_min_length?: number
    session_timeout_minutes?: number
  }
}

export interface OrganizationStats {
  total_users: number
  active_users: number
  total_clients: number
  total_cases: number
  active_cases: number
  storage_used_gb: number
  storage_used_percentage: number
}

export interface OrganizationUsage {
  users: {
    current: number
    limit: number
    percentage: number
  }
  storage: {
    current_gb: number
    limit_gb: number
    percentage: number
  }
  cases: {
    current: number
    limit: number | null
    percentage: number | null
  }
}

// Form types for creating/updating organizations
export interface CreateOrganizationInput {
  name: string
  slug: string
  cnpj?: string
  email: string
  phone?: string
  address?: OrganizationAddress
  plan: OrganizationPlan
  max_users?: number
  max_storage_gb?: number
  billing_email?: string
  billing_cycle?: BillingCycle
  
  // Initial admin user info
  admin_email?: string
  admin_name?: string
}

export interface UpdateOrganizationInput {
  name?: string
  email?: string
  phone?: string
  address?: OrganizationAddress
  billing_email?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  settings?: Partial<OrganizationSettings>
}

export interface UpdateOrganizationPlanInput {
  plan: OrganizationPlan
  max_users?: number
  max_storage_gb?: number
  max_cases?: number
}

export interface UpdateOrganizationStatusInput {
  status: OrganizationStatus
  reason?: string
}

// Activation flow
export interface OrganizationActivationToken {
  token: string
  org_id: string
  email: string
  expires_at: string
  used: boolean
}

export interface ActivateOrganizationInput {
  token: string
  admin_name: string
  admin_password: string
}
