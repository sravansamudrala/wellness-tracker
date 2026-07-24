import api from "./api";

// ----- Types (mirror the backend's snake_case response shapes) -----

export interface Exercise {
  id: string;
  name: string;
  category: string | null;
  primary_muscle_group_id: string | null;
  primary_muscle_group_name: string | null;
  difficulty: string | null;
  instructions: string | null;
  image_url: string | null;
  video_url: string | null;
  is_custom: boolean;
}

export interface MuscleGroup {
  id: string;
  name: string;
  image_url: string | null;
}

export interface SessionSet {
  id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  is_warmup: boolean;
  is_completed: boolean;
  rest_seconds: number | null;
}

export interface SessionExercise {
  id: string;
  order_index: number;
  notes: string | null;
  exercise: Exercise;
  sets: SessionSet[];
}

export interface WorkoutSession {
  id: string;
  name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface WorkoutSessionDetail extends WorkoutSession {
  exercises: SessionExercise[];
}

export interface GymState {
  id: string;
  unit: string;
  rotation_order: string[];
}

export interface NextCategory {
  muscle_group: MuscleGroup | null;
}

export interface GymStats {
  total_workouts: number;
  current_streak: number;
  best_streak: number;
  this_week: number;
  last_workout_date: string | null;
  days_since_last: number | null;
  message: string;
}

export interface VolumePoint {
  date: string;
  volume_kg: number;
}

export interface VolumeResponse {
  range: string;
  total_volume_kg: number;
  points: VolumePoint[];
}

export interface RecordItem {
  exercise_id: string;
  exercise_name: string;
  max_weight_kg: number | null;
  estimated_1rm_kg: number | null;
  max_volume_kg: number | null;
}

export interface RecoveryItem {
  muscle_group_id: string;
  muscle_group_name: string;
  last_trained: string | null;
  days_since: number | null;
}

// ----- Endpoints (all under /api/v1/gym) -----

// ----- Catalog (for the freestyle "Log Workout" screen) -----

export const getExercises = async (): Promise<Exercise[]> => {
  const response = await api.get<Exercise[]>("/api/v1/gym/exercises");
  return response.data;
};

export const getMuscleGroups = async (): Promise<MuscleGroup[]> => {
  const response = await api.get<MuscleGroup[]>("/api/v1/gym/muscle-groups");
  return response.data;
};

export const createExercise = async (
  name: string,
  muscle_group_id: string | null
): Promise<Exercise> => {
  const response = await api.post<Exercise>("/api/v1/gym/exercises", {
    name,
    muscle_group_id,
  });
  return response.data;
};

export const updateExercise = async (
  exerciseId: string,
  name: string
): Promise<Exercise> => {
  const response = await api.put<Exercise>(
    `/api/v1/gym/exercises/${exerciseId}`,
    { name }
  );
  return response.data;
};

export const deleteExercise = async (exerciseId: string): Promise<void> => {
  await api.delete(`/api/v1/gym/exercises/${exerciseId}`);
};

// ----- State (unit preference + rotation order) -----

export const getState = async (): Promise<GymState> => {
  const response = await api.get<GymState>("/api/v1/gym/state");
  return response.data;
};

export const updateState = async (
  unit: string,
  rotation_order: string[]
): Promise<GymState> => {
  const response = await api.put<GymState>("/api/v1/gym/state", {
    unit,
    rotation_order,
  });
  return response.data;
};

export const getNextCategory = async (): Promise<NextCategory> => {
  const response = await api.get<NextCategory>("/api/v1/gym/log/next-category");
  return response.data;
};

// ----- Sessions -----

export const quickLog = async (
  exercise_ids: string[],
  name?: string
): Promise<WorkoutSessionDetail> => {
  const response = await api.post<WorkoutSessionDetail>(
    "/api/v1/gym/sessions/quick-log",
    { exercise_ids, name }
  );
  return response.data;
};

export const getHistory = async (): Promise<WorkoutSession[]> => {
  const response = await api.get<WorkoutSession[]>("/api/v1/gym/sessions");
  return response.data;
};

export const getSession = async (
  sessionId: string
): Promise<WorkoutSessionDetail> => {
  const response = await api.get<WorkoutSessionDetail>(
    `/api/v1/gym/sessions/${sessionId}`
  );
  return response.data;
};

// ----- Insights -----

export const getStats = async (): Promise<GymStats> => {
  const response = await api.get<GymStats>("/api/v1/gym/insights/stats");
  return response.data;
};

export const getVolume = async (range = "all"): Promise<VolumeResponse> => {
  const response = await api.get<VolumeResponse>(
    `/api/v1/gym/insights/volume?range=${range}`
  );
  return response.data;
};

export const getRecords = async (): Promise<RecordItem[]> => {
  const response = await api.get<RecordItem[]>("/api/v1/gym/insights/records");
  return response.data;
};

export const getRecovery = async (): Promise<RecoveryItem[]> => {
  const response = await api.get<RecoveryItem[]>(
    "/api/v1/gym/insights/recovery"
  );
  return response.data;
};
