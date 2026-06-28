import { apiGet } from './client.ts';

export interface HealthResponse {
  status: string;
}

export const healthApi = {
  get: (): Promise<HealthResponse> => apiGet<HealthResponse>('/health'),
};
