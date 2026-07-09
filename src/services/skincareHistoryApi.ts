import api from "./api";

export interface SkincareHistoryItem {
  date: string;
  completed: number;
  total: number;
  progress: number;
}

export const getHistory = async () => {
  const response = await api.get("/api/v1/skincare/history");
  return response.data;
};
