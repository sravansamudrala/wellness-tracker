import api from "./api";

export interface FoodEntry {
  id: string;
  name: string;
  quantity: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
}

export interface FoodToday {
  entries: FoodEntry[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}

export interface FoodEntryCreate {
  name: string;
  quantity: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface FoodPhotoItem {
  name: string;
  quantity: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export interface FoodPhotoAnalysis {
  items: FoodPhotoItem[];
}

export const getToday = async (): Promise<FoodToday> => {
  const response = await api.get<FoodToday>("/api/v1/food/today");
  return response.data;
};

export const createEntry = async (entry: FoodEntryCreate): Promise<FoodEntry> => {
  const response = await api.post<FoodEntry>("/api/v1/food", entry);
  return response.data;
};

export const deleteEntry = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/food/${id}`);
};

export const analyzePhoto = async (file: File): Promise<FoodPhotoAnalysis> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<FoodPhotoAnalysis>(
    "/api/v1/food/analyze-photo",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};