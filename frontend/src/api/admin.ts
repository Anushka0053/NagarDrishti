import { apiClient } from './client';

export interface AdminOverviewData {
  status: string;
  timestamp: string;
  total_gis_features: number;
  total_active_layers: number;
  total_citizen_reports: number;
  reports_by_status: Record<string, number>;
  cities: Array<{
    id: string;
    name_en: string;
    name_hi: string;
    slug: string;
    is_enabled: boolean;
    feature_count: number;
  }>;
  departments_workload: Array<{
    department: string;
    reports_count: number;
  }>;
  recent_ingestion_runs: Array<{
    id: string;
    run_type: string;
    status: string;
    records_inserted: number;
    started_at: string;
  }>;
}

export interface AdminUserData {
  id: string;
  role: string;
  full_name: string;
  phone_number?: string;
  preferred_city_id?: string;
  department_id?: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuditLogData {
  id: string;
  actor_id?: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  diff_before?: any;
  diff_after?: any;
  created_at: string;
}

export interface SystemHealthData {
  status: string;
  app_name: string;
  environment: string;
  latency_ms: number;
  database: {
    status: string;
    postgis_version: string;
    verified_core_tables: number;
    pool_size: number;
    max_overflow: number;
  };
  geospatial_scope: {
    state: string;
    reference_cities: string[];
    coordinate_reference_system: string;
  };
  adapters: {
    sarvam_ai: {
      configured: boolean;
      stt_model: string;
      tts_model: string;
      mode: string;
    };
    routing_engine: {
      url: string;
      status: string;
    };
  };
}

export const adminApi = {
  getOverview: () => apiClient<AdminOverviewData>('/admin/overview'),

  getUsers: (params?: { city_id?: string; role?: string; limit?: number; offset?: number }) =>
    apiClient<{ total: number; users: AdminUserData[] }>('/admin/users', { params }),

  updateUserRole: (userId: string, data: { role: string; city_id?: string; department_id?: string; is_verified?: boolean }) =>
    apiClient<{ status: string; message: string; user_id: string; new_role: string }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAuditLogs: (params?: { limit?: number; offset?: number; action?: string }) =>
    apiClient<{ total: number; logs: AuditLogData[] }>('/admin/audit-logs', { params }),

  getIngestionRuns: (limit: number = 20) =>
    apiClient<Array<any>>('/admin/ingestion-runs', { params: { limit } }),

  getSystemHealth: () => apiClient<SystemHealthData>('/health'),
};

