import api from "./api";

export interface SkincareHabitCompletion {
  habit_id: string;
  name: string;
  completed: boolean;
}

export interface SkincareToday {
  id: string;
  date: string;
  habits: SkincareHabitCompletion[];
  created_at: string;
  updated_at: string;
}

export interface SkincareHabit {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface SkincareHabitUpsertItem {
  id?: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export const getToday = async (): Promise<SkincareToday> => {
  const response = await api.get<SkincareToday>("/api/v1/skincare/today");
  return response.data;
};

export const updateToday = async (
  habits: { habit_id: string; completed: boolean }[]
): Promise<SkincareToday> => {
  const response = await api.put<SkincareToday>("/api/v1/skincare/today", {
    habits,
  });
  return response.data;
};

export const getHabits = async (): Promise<SkincareHabit[]> => {
  const response = await api.get<SkincareHabit[]>("/api/v1/skincare/habits");
  return response.data;
};

export const upsertHabits = async (
  habits: SkincareHabitUpsertItem[]
): Promise<SkincareHabit[]> => {
  const response = await api.put<SkincareHabit[]>("/api/v1/skincare/habits", {
    habits,
  });
  return response.data;
};