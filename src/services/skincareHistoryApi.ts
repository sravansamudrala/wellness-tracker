import api from "./api";

export interface SkincareHistoryItem {
  date: string;

  completed: number;
  total: number;
  progress: number;

  face_wash: boolean;
  vitamin_c: boolean;
  moisturizer: boolean;
  sunscreen: boolean;
  lipcare: boolean;

  cleanser: boolean;
  evening_moisturizer: boolean;
}

export const getHistory = async () => {
  const response = await api.get("/api/v1/skincare/history");
  return response.data;
};
