import api from "./api";
import type { SkincareHabitCompletion } from "./skincareApi";

export interface SkincareHistoryItem {
  date: string;

  completed: number;
  total: number;
  progress: number;

  habits: SkincareHabitCompletion[];
}

export const getHistory = async (): Promise<SkincareHistoryItem[]> => {
  const response = await api.get<SkincareHistoryItem[]>(
    "/api/v1/skincare/history"
  );
  return response.data;
};
