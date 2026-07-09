import api from "./api";

export interface SkincareStats {
  current_streak: number;
  best_streak: number;
  total_days: number;
  average_completion: number;
}

export const getStats = async (): Promise<SkincareStats> => {
  const response = await api.get<SkincareStats>("/api/v1/skincare/stats");
  return response.data;
};
