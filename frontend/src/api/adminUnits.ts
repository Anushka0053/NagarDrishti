import { apiClient } from './client';

export interface AdminUnit {
  id: string;
  parent_id?: string | null;
  unit_type: string;
  name_en: string;
  name_hi: string;
  slug: string;
  lgd_code?: string;
  census_code?: string;
  state_code?: string;
  is_active: boolean;
}

export const adminUnitsApi = {
  getAdminUnits: (unitType?: string, stateCode: string = 'MP') =>
    apiClient<AdminUnit[]>('/admin-units', {
      params: { unit_type: unitType, state_code: stateCode },
    }),
};
