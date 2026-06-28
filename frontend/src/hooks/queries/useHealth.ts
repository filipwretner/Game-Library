import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { healthApi, type HealthResponse } from '../../api/healthApi.ts';

/**
 * Query hook (spec §8.1). Components read server state through hooks like this;
 * server state lives in TanStack Query, never copied into useState.
 */
export function useHealth(): UseQueryResult<HealthResponse> {
  return useQuery({
    queryKey: ['health'],
    queryFn: healthApi.get,
  });
}
