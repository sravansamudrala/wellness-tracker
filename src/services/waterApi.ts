import api from "./api";

export interface WaterEntry {
  id: string;
  date: string;
  amount_ml: number;
  created_at: string;
  updated_at: string;
}

export interface AddWaterRequest {
  amount_ml: number;
}

export interface WaterSettingsUpdateRequest {
  daily_goal_ml: number;
}

export interface WaterSettings {
  id: string;
  daily_goal_ml: number;
  created_at: string;
  updated_at: string;
}

export interface WaterStats {
  current_streak: number;
  best_streak: number;
  total_days: number;
  average_completion: number;
  message: string;
}

export const getWaterToday = async (): Promise<WaterEntry> => {
  const response = await api.get("/api/v1/water/today");
  return response.data;
};

export const addWater = async (data: AddWaterRequest): Promise<WaterEntry> => {
  const response = await api.post("/api/v1/water/today/add", data);
  return response.data;
};

export const getWaterSettings = async (): Promise<WaterSettings> => {
  const response = await api.get("/api/v1/water/settings");
  return response.data;
};

export const updateWaterSettings = async (data: WaterSettingsUpdateRequest): Promise<WaterSettings> => {
  const response = await api.put("/api/v1/water/settings", data);
  return response.data;
};

export const getWaterStats = async (): Promise<WaterStats> => {
  const response = await api.get("/api/v1/water/stats");
  return response.data;
};
